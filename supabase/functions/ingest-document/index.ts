import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Auth: verify JWT or internal secret
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    if (!token || (token !== internalSecret)) {
      // Try JWT verification for user-facing calls
      const verifyClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { workspace_id, source_id, storage_path } = await req.json()

    await supabase.from('kb_sources').update({ status: 'processing' }).eq('id', source_id)

    const { data: fileData, error: downloadError } = await supabase.storage.from('kb-documents').download(storage_path)
    if (downloadError) throw downloadError

    const ext = storage_path?.split('.').pop()?.toLowerCase() || ''

    let text = ""
    if (ext === 'txt') {
      text = await fileData.text()
    } else if (ext === 'pdf') {
      text = extractPdfText(await fileData.arrayBuffer())
    } else {
      text = await fileData.text()
    }

    text = text.replace(/\s+/g, ' ').trim()
    if (text.length < 10) throw new Error("No meaningful content found in document.")

    const chunks = splitIntoChunks(text, 1000)

    const chunksToInsert = []
    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i]
      const embedding = await model.run(content, {
        mean_pool: true,
        normalize: true,
      })
      chunksToInsert.push({
        workspace_id,
        source_id,
        content,
        embedding: Array.from(embedding),
        chunk_index: i,
        token_count: Math.ceil(content.length / 4)
      })
    }

    if (chunksToInsert.length > 0) {
      await supabase.from('kb_chunks').insert(chunksToInsert)
    }
    await supabase.from('kb_sources').update({ status: 'active', chunk_count: chunks.length }).eq('id', source_id)

    return new Response(JSON.stringify({ success: true, chunks: chunks.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error(error)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { source_id } = await req.clone().json().catch(() => ({}))
      if (source_id) {
        await supabase.from('kb_sources').update({ status: 'failed', error_message: error.message }).eq('id', source_id)
      }
    } catch {}
    return new Response(JSON.stringify({ error: "Document ingestion failed" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

function extractPdfText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8')
  const content = decoder.decode(bytes)

  const texts: string[] = []
  const btMatches = content.match(/BT[\s\S]*?ET/g)
  if (btMatches) {
    for (const block of btMatches) {
      const parenMatches = block.match(/\(([^)]*)\)/g)
      if (parenMatches) {
        for (const p of parenMatches) {
          texts.push(p.slice(1, -1))
        }
      }
    }
  }

  if (texts.length === 0) {
    const rawText = content.replace(/[^a-zA-Z0-9\s.,!?;:'"()-]/g, ' ').replace(/\s+/g, ' ').trim()
    if (rawText.length > 50) return rawText
  }

  return texts.join(' ')
}

function splitIntoChunks(text: string, maxSize: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks: string[] = []
  let current = ""
  for (const sentence of sentences) {
    if ((current + sentence).length > maxSize && current.length > 0) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length > 0 ? chunks : [text.slice(0, maxSize)]
}
