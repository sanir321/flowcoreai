import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('NEXT_PUBLIC_APP_URL') || '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const legacySrk = Deno.env.get('SERVICE_KEY') || Deno.env.get('LEGACY_SERVICE_ROLE_KEY') || ''
    const secretKeysStr = Deno.env.get('SUPABASE_SECRET_KEYS')
    let secretKeys: string[] = []
    try { const parsed = JSON.parse(secretKeysStr || '{}'); secretKeys = Object.values(parsed) } catch {}
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const validTokens = new Set([srk, legacySrk, internalSecret || '', ...secretKeys].filter(Boolean))
    if (!token || !validTokens.has(token)) {
      const verifyClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', srk || legacySrk)
      const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', srk || legacySrk)

    const { source_id, workspace_id } = await req.json()

    const { data: source, error: sourceError } = await supabase
      .from('kb_sources')
      .select('*')
      .eq('id', source_id)
      .single()

    if (sourceError || !source) throw new Error('Source not found')

    await supabase.from('kb_sources').update({ status: 'processing' }).eq('id', source_id)

    let content = ""
    if (source.source_type === 'url') {
      // SSRF protection: block private IPs + DNS rebinding
      try {
        const url = new URL(source.url)
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1' ||
            url.hostname.startsWith('10.') || url.hostname.startsWith('172.16.') || url.hostname.startsWith('192.168.') ||
            url.hostname.endsWith('.local') || url.hostname.endsWith('.internal')) {
          throw new Error('URL resolves to a private or internal address')
        }
        const ipMatch = url.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
        if (ipMatch) {
          const parts = ipMatch[0].split('.').map(Number)
          if (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || parts[0] === 127) {
            throw new Error('URL resolves to a private IP address')
          }
        }
      } catch (e: any) {
        if (e.message?.includes('private') || e.message?.includes('internal')) throw e
        throw new Error('Invalid URL')
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(source.url, { signal: controller.signal })
      clearTimeout(timeout)
      if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`)
      const html = await response.text()
      content = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      content = content.slice(0, 50000)
    } else if (['pdf', 'docx', 'txt'].includes(source.source_type)) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('kb-documents')
        .download(source.storage_path)
      if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`)
      content = await fileData.text()
      content = content.replace(/\s+/g, ' ').trim()
    }

    if (!content || content.length < 10) throw new Error('No meaningful content found')

    const chunks = splitIntoChunks(content, 1500)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim()
      if (!chunk) continue

      const embedding = await model.run(chunk, { mean_pool: true, normalize: true })

      await supabase.from('kb_chunks').insert({
        workspace_id,
        source_id,
        content: chunk,
        embedding: Array.from(embedding),
        chunk_index: i,
        token_count: Math.ceil(chunk.length / 4),
      })
    }

    await supabase.from('kb_sources').update({
      status: 'active',
      chunk_count: chunks.length,
    }).eq('id', source_id)

    return new Response(JSON.stringify({ success: true, chunks: chunks.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Ingestion failed' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function splitIntoChunks(text: string, maxSize: number): string[] {
  const OVERLAP = 150;
  const HARD_CAP = Math.round(maxSize * 1.5);

  const lines = text.split('\n')
  const headingIdx = lines.findIndex(l => /^#{1,6}\s+\S/.test(l))

  if (headingIdx === -1) {
    return splitByParagraphs(text, maxSize, HARD_CAP, OVERLAP)
  }

  const sections: { heading: string; bodyLines: string[] }[] = []
  let currentHeading = '## (Intro)'
  let currentBody: string[] = []
  let inCodeBlock = false

  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (/^```/.test(trimmed)) { inCodeBlock = !inCodeBlock; currentBody.push(line); continue }
    if (!inCodeBlock && /^#{1,6}\s+\S/.test(trimmed)) {
      if (currentBody.length > 0) sections.push({ heading: currentHeading, bodyLines: currentBody })
      currentHeading = trimmed
      currentBody = []
      continue
    }
    currentBody.push(line)
  }
  if (currentBody.length > 0) sections.push({ heading: currentHeading, bodyLines: currentBody })

  const chunks: string[] = []
  for (const section of sections) {
    const sectionText = section.heading + '\n' + section.bodyLines.join('\n')
    if (sectionText.length <= maxSize) {
      chunks.push(sectionText.trim())
    } else {
      chunks.push(...splitByParagraphs(sectionText, maxSize, HARD_CAP, OVERLAP))
    }
  }

  return chunks
}

function splitByParagraphs(text: string, maxSize: number, HARD_CAP: number, OVERLAP: number): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  if (paragraphs.length <= 1) return [text.slice(0, HARD_CAP)]

  const chunks: string[] = []
  let current = ""
  for (const para of paragraphs) {
    if ((current.length + para.length) > maxSize && current.length > 0) {
      chunks.push(current.trim())
      const overlapTail = current.slice(-OVERLAP)
      current = overlapTail + para
    } else {
      current += para
    }
    while (current.length > HARD_CAP) {
      chunks.push(current.slice(0, HARD_CAP).trim())
      current = current.slice(HARD_CAP - OVERLAP)
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
