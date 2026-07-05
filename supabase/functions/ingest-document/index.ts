import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"
import mammoth from "npm:mammoth@1.8.0"
import { Buffer } from "node:buffer"

const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL')
const corsHeaders = {
  'Access-Control-Allow-Origin': APP_URL ?? '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
}

let model: Supabase.ai.Session | null = null
async function getEmbeddingModel(): Promise<Supabase.ai.Session> {
  if (!model) {
    model = new Supabase.ai.Session('gte-small')
  }
  return model
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const serviceKey = Deno.env.get('SERVICE_KEY') || ''
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const validTokens = new Set([srk, serviceKey, internalSecret || ''].filter(Boolean))
    if (!token || !validTokens.has(token)) {
      const verifyClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', srk)
      const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', srk)
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

      let embedding: any
      try {
        const embedModel = await getEmbeddingModel()
        embedding = await embedModel.run(chunks[i], { mean_pool: true, normalize: true })
      } catch (embedErr: any) {
        throw new Error(`Embedding failed (chunk ${i + 1}/${chunks.length}): ${embedErr.message}`)
      }
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
        await supabase.from('kb_sources').update({ status: 'failed', error_message: "Document ingestion failed" }).eq('id', source_id)
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
  const OVERLAP = 150;
  const HARD_CAP = Math.round(maxSize * 1.5);

  const urls: string[] = []
  const cleaned = text.replace(/https?:\/\/[^\s<>"]+/g, (url) => {
    urls.push(url)
    return `\x00URL_${urls.length - 1}\x00`
  })

  const restore = (s: string) => s.replace(/\x00URL_(\d+)\x00/g, (_, i) => urls[Number(i)] || "")

  const lines = cleaned.split('\n')
  const headingIdx = lines.findIndex(l => /^#{1,6}\s+\S/.test(l))

  if (headingIdx === -1) {
    return splitByParagraphs(cleaned, maxSize, HARD_CAP, OVERLAP, restore)
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
    const cleanedSection = restore(sectionText)
    if (cleanedSection.length <= maxSize) {
      chunks.push(cleanedSection.trim())
    } else {
      chunks.push(...splitByParagraphs(cleanedSection, maxSize, HARD_CAP, OVERLAP, restore))
    }
  }

  return chunks
}

function splitByParagraphs(text: string, maxSize: number, HARD_CAP: number, OVERLAP: number, restore: (s: string) => string): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  if (paragraphs.length <= 1) return [restore(text).slice(0, HARD_CAP)]

  const chunks: string[] = []
  let current = ""
  for (const para of paragraphs) {
    const restored = restore(para)
    if ((current.length + restored.length) > maxSize && current.length > 0) {
      chunks.push(current.trim())
      const overlapTail = current.slice(-OVERLAP)
      current = overlapTail + restored
    } else {
      current += restored
    }
    while (current.length > HARD_CAP) {
      chunks.push(current.slice(0, HARD_CAP).trim())
      current = current.slice(HARD_CAP - OVERLAP)
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
    .then(() => {})
    .catch((err) => {
      console.error(`[FireAndForget] ${functionName} failed:`, err.message)
      supabase.from('kb_sources').update({ error_message: `BP extraction failed: ${err.message}` }).eq('id', (body as any).source_id).catch(() => {})
    })
}
