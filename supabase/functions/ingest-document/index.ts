import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import mammoth from "npm:mammoth@1.8.0"
import { Buffer } from "node:buffer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const opencodeKey = Deno.env.get('OPENCODE_ZEN_API_KEY')

    const { workspace_id, source_id, storage_path } = await req.json()

    await supabase.from('kb_sources').update({ status: 'processing', error_message: 'Downloading file...' }).eq('id', source_id)

    const { data: fileData, error: downloadError } = await supabase.storage.from('kb-documents').download(storage_path)
    if (downloadError) throw downloadError

    const ext = storage_path?.split('.').pop()?.toLowerCase() || ''

    await supabase.from('kb_sources').update({ error_message: `Extracting text from ${ext.toUpperCase()}...` }).eq('id', source_id)

    let text = ""
    if (ext === 'txt') {
      text = await fileData.text()
    } else if (ext === 'docx') {
        const arrayBuf = await fileData.arrayBuffer()
        const nodeBuf = Buffer.from(arrayBuf)
        const result = await mammoth.extractRawText({ buffer: nodeBuf })
      text = result.value
    } else if (ext === 'pdf') {
      text = extractPdfText(await fileData.arrayBuffer())
      if (text.includes("[Image PDF")) {
        throw new Error("This PDF appears to be a scanned document (image-only). Please upload a text-based PDF or use a TXT/DOCX file instead.")
      }
      if (opencodeKey && (text.length < 50 || isGarbled(text))) {
        text = await cleanTextWithOpenCode(text, opencodeKey)
      }
    } else {
      text = await fileData.text()
    }

    text = text.replace(/\s+/g, ' ').trim()
    if (text.length < 10) throw new Error("No meaningful content found in document.")

    const docSocial = parseSocialUrls(text)
    const docSocialKeys = Object.keys(docSocial)
    if (docSocialKeys.length > 0) {
      const labeled = docSocialKeys.map(k => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${docSocial[k]}`)
      text = text + '\n\n---\nSocial Links:\n' + labeled.join('\n')
    }

    await supabase.from('kb_sources').update({ error_message: 'Chunking content...' }).eq('id', source_id)

    const chunks = splitIntoChunks(text, 1000)

    const chunksToInsert = []
    for (let i = 0; i < chunks.length; i++) {
      await supabase.from('kb_sources').update({ error_message: `Embedding chunk ${i + 1}/${chunks.length}...` }).eq('id', source_id)

      const embedding = await model.run(chunks[i], { mean_pool: true, normalize: true })
      chunksToInsert.push({
        workspace_id, source_id,
        content: chunks[i],
        embedding: Array.from(embedding),
        chunk_index: i,
        token_count: Math.ceil(chunks[i].length / 4)
      })
    }

    const { error: deleteError } = await supabase.from('kb_chunks').delete().eq('source_id', source_id)
    if (deleteError) throw new Error(`Failed to clear old chunks: ${deleteError.message}`)

    if (chunksToInsert.length > 0) {
      const { error: insertError } = await supabase.from('kb_chunks').insert(chunksToInsert)
      if (insertError) throw new Error(`Failed to save chunks: ${insertError.message}`)
    }

    await supabase.from('kb_sources').update({
      status: 'active', chunk_count: chunks.length, error_message: null, updated_at: new Date().toISOString()
    }).eq('id', source_id)

    await supabase.from('ingestion_jobs').update({ status: 'completed' }).eq('source_id', source_id)

    if (opencodeKey && chunks.length > 0) {
      fireAndForget(supabase, "extract-business-profile", { workspace_id, source_id })
    }

    return new Response(JSON.stringify({ success: true, chunks: chunks.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error(error)
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
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
        for (const p of parenMatches) texts.push(p.slice(1, -1))
      }
    }
  }

  if (texts.length === 0) {
    const rawText = content.replace(/[^a-zA-Z0-9\s.,!?;:'"()-]/g, ' ').replace(/\s+/g, ' ').trim()
    if (rawText.length > 50) return rawText
  }

  const joined = texts.join(' ').trim()
  if (joined.length > 10) return joined

  return "[Image PDF — no extractable text layer]"
}

function isGarbled(text: string): boolean {
  const alphaRatio = (text.match(/[a-zA-Z]/g) || []).length / Math.max(text.length, 1)
  return alphaRatio < 0.3
}

async function cleanTextWithOpenCode(rawText: string, apiKey: string): Promise<string> {
  const chunk = rawText.slice(0, 30000)
  const baseUrl = Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1"
  if (chunk.length < 20) return rawText

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nemotron-3-ultra-free",
      messages: [
        { role: "system", content: "You are a PDF text recovery expert. The input is raw bytes from a PDF that may contain garbled text, binary noise, or be from a scanned/image PDF. Your job: find and clean any readable text. Skip binary garbage, control characters, and non-readable sequences. If the page is mostly binary (image-based), return a clear message: '[Image-based page — no text recovered]'. Return ONLY cleaned text, no commentary." },
        { role: "user", content: `Recover any readable text from this raw PDF content:\n\n${chunk}` }
      ],
      temperature: 0.1,
      max_tokens: 16000,
    }),
  })

  if (!response.ok) return rawText

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content
  const cleaned = (content && content.length > 10 && !content.includes("[Image-based page")) ? content : rawText
  return cleaned
}

function parseSocialUrls(text: string): Record<string, string> {
  const social: Record<string, string> = {}
  const labelMap: Record<string, string> = {
    facebook: "facebook", instagram: "instagram", linkedin: "linkedin",
    youtube: "youtube", twitter: "twitter", pinterest: "pinterest",
  }
  for (const [domain, key] of Object.entries(labelMap)) {
    const re = new RegExp(`${domain}:\\s*(https?://[^\\s]+)`, "i")
    const match = text.match(re)
    if (match) social[key] = match[1].replace(/\/+$/, "")
  }

  const hrefRe = /https?:\/\/(?:www\.)?(facebook|instagram|linkedin|youtube|twitter|x|pinterest)[^\s"'>]+/gi
  let m
  while ((m = hrefRe.exec(text)) !== null) {
    const domain = m[1].toLowerCase()
    const key = domain === "x" ? "twitter" : domain
    if (!social[key]) {
      social[key] = m[0].replace(/\/+$/, "")
    }
  }

  return social
}

function splitIntoChunks(text: string, maxSize: number): string[] {
  const urls: string[] = []
  const cleaned = text.replace(/https?:\/\/[^\s<>"]+/g, (url) => {
    urls.push(url)
    return `\x00URL_${urls.length - 1}\x00`
  })

  const sentenceRegex = /[^.!?]+[.!?]+/g
  const sentences: string[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = sentenceRegex.exec(cleaned)) !== null) {
    sentences.push(m[0])
    lastIndex = sentenceRegex.lastIndex
  }
  const tail = cleaned.slice(lastIndex).trim()
  if (tail) sentences.push(tail)

  if (sentences.length === 0) return [text.slice(0, maxSize)]

  const chunks: string[] = []
  let current = ""
  for (const sentence of sentences) {
    const restored = sentence.replace(/\x00URL_(\d+)\x00/g, (_, i) => urls[Number(i)] || "")
    if ((current.length + restored.length) > maxSize && current.length > 0) {
      chunks.push(current.trim())
      current = restored
    } else {
      current += restored
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function fireAndForget(supabase: any, functionName: string, body: object) {
  const secret = Deno.env.get('INTERNAL_CRON_SECRET')
  supabase.functions.invoke(functionName, { body, headers: { Authorization: `Bearer ${secret}` } })
    .then(r => r.text())
    .then(t => { try { const j = JSON.parse(t); if (j.error) throw new Error(j.error) } catch { if (!t.includes('success')) throw new Error(t) } })
    .then(() => console.log(`[FireAndForget] ${functionName} succeeded`))
    .catch((err) => {
      console.error(`[FireAndForget] ${functionName} failed:`, err.message)
      supabase.from('kb_sources').update({ error_message: `BP extraction failed: ${err.message}` }).eq('id', (body as any).source_id).catch(() => {})
    })
}
