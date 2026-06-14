import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('NEXT_PUBLIC_APP_URL') || '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRIVATE_CIDRS = [
  { prefix: [10], mask: 8 },
  { prefix: [172, 16], mask: 12 },
  { prefix: [192, 168], mask: 16 },
  { prefix: [127], mask: 8 },
  { prefix: [169, 254], mask: 16 },
  { prefix: [0], mask: 8 },
  { prefix: [100, 64], mask: 10 },
]

function isPrivateIP(hostname: string): boolean {
  try {
    const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    if (!isIPv4) return false
    const parts = hostname.split('.').map(Number)
    if (parts.some(p => p < 0 || p > 255)) return true
    for (const cidr of PRIVATE_CIDRS) {
      let match = true
      for (let i = 0; i < cidr.prefix.length; i++) {
        if (parts[i] !== cidr.prefix[i]) { match = false; break }
      }
      if (match) return true
    }
    return false
  } catch { return true }
}

function validateUrl(raw: string): URL {
  let url: URL
  try { url = new URL(raw) } catch { throw new Error('Invalid URL format') }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS URLs are allowed')
  if (isPrivateIP(url.hostname)) throw new Error(`Access to ${url.hostname} is not allowed`)
  return url
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

    const { workspace_id, source_id, url: rawUrl } = await req.json()
    const url = validateUrl(rawUrl)

    await supabase.from('kb_sources').update({ status: 'processing', error_message: 'Fetching website content...' }).eq('id', source_id)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`)

    const raw = await response.text()
    if (raw.length > 1000000) throw new Error("Page too large (>1MB). Use document upload instead.")
    const html = raw.slice(0, 100000)

    await supabase.from('kb_sources').update({ error_message: 'Extracting content with AI...' }).eq('id', source_id)

    let text = ""
    if (opencodeKey) {
      text = await extractContentWithOpenCode(html, raw, opencodeKey)
    }

    if (!text || text.length < 10) {
      text = convertHtmlToText(html)
    }

    if (text.length < 10) throw new Error("No meaningful content found on the page.")

    await supabase.from('kb_sources').update({ error_message: 'Chunking content...' }).eq('id', source_id)

    const chunks = splitIntoChunks(text, 5000)

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
    return new Response(JSON.stringify({ error: "URL ingestion failed" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function extractContentWithOpenCode(html: string, rawHtml: string, apiKey: string): Promise<string> {
  const stripped = convertHtmlToText(html)
  const baseUrl = Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1"

  if (stripped.length < 50) return stripped

  let extracted = stripped
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nemotron-3-ultra-free",
        messages: [
          {
            role: "system",
            content: "You are a web content extractor. Given raw website text, extract the main body content. Remove: navigation menus, sidebars, header banners, cookie notices, ads, boilerplate, HTML comment artifacts, orphaned tags like '-->', repeated whitespace, and '\\r\\n' markers. Collapse excessive blank lines. PRESERVE: footer sections that contain social media links (Facebook, Instagram, LinkedIn, Twitter, YouTube), contact info, email addresses, phone numbers, and business addresses. Preserve the core article or page content — headings, paragraphs, lists, tables — in clean readable text. Return ONLY the extracted content, no commentary."
          },
          {
            role: "user",
            content: `Extract the main content from this website text. Clean up any HTML artifacts, normalize whitespace, and return only the readable text:\n\n${stripped.slice(0, 25000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 16000,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      const content = result.choices?.[0]?.message?.content
      if (content && content.length > 10) extracted = content
    } else {
      console.error("[OpenCodeURL] API error:", response.status)
    }
  } catch (err) {
    console.error("[OpenCodeURL] fetch error:", err)
  } finally {
    clearTimeout(timeout)
  }

  const socialUrls = extractSocialUrls(rawHtml)
  const missingSocial = socialUrls.filter(url => !extracted.includes(url))
  if (missingSocial.length > 0) {
    const labeled = missingSocial.map(u => {
      if (u.includes('facebook')) return `Facebook: ${u}`
      if (u.includes('instagram')) return `Instagram: ${u}`
      if (u.includes('linkedin')) return `LinkedIn: ${u}`
      if (u.includes('youtube')) return `YouTube: ${u}`
      if (u.includes('twitter') || u.includes('x.com')) return `Twitter: ${u}`
      if (u.includes('pinterest')) return `Pinterest: ${u}`
      if (u.startsWith('mailto:')) return `Email: ${u.replace('mailto:', '')}`
      return u
    })
    return extracted + '\n\n---\nSocial Links:\n' + labeled.join('\n')
  }
  return extracted
}

function extractSocialUrls(html: string): string[] {
  const social: string[] = []
  const hrefRegex = /href=["'](https?:\/\/(?:www\.)?(?:facebook|instagram|linkedin|youtube|twitter|x|pinterest)[^\s"']+)["']/gi
  let match
  while ((match = hrefRegex.exec(html)) !== null) {
    social.push(match[1])
  }
  const emailRegex = /href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/gi
  while ((match = emailRegex.exec(html)) !== null) {
    social.push('mailto:' + match[1])
  }
  return [...new Set(social)]
}

function convertHtmlToText(html: string): string {
  html = html.replace(/<!--[\s\S]*?-->/g, '')
  html = html.replace(/\r\n/g, '\n')
  html = html.replace(/<(script|style|svg|noscript|nav|header|aside|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
  html = html.replace(/<br\s*\/?>/gi, '\n')
  html = html.replace(/<\/p>/gi, '\n\n')
  html = html.replace(/<\/h([1-6])>/gi, '\n\n')
  html = html.replace(/<h([1-6])[^>]*>/gi, (_, n) => '#'.repeat(Number(n)) + ' ')
  html = html.replace(/<li[^>]*>/gi, '\n- ')
  html = html.replace(/<\/(?:li|ol|ul|table|tr|div|dd|dt|hgroup)>/gi, '\n')
  html = html.replace(/<th[^>]*>/gi, '| ')
  html = html.replace(/<td[^>]*>/gi, '| ')
  html = html.replace(/<hr\s*\/?>/gi, '\n---\n')
  html = html.replace(/<(?:strong|b)\b[^>]*>/gi, '**')
  html = html.replace(/<\/(?:strong|b)>/gi, '**')
  html = html.replace(/<(?:em|i)\b[^>]*>/gi, '*')
  html = html.replace(/<\/(?:em|i)>/gi, '*')
  html = html.replace(/<code[^>]*>/gi, '`')
  html = html.replace(/<\/code>/gi, '`')
  html = html.replace(/<pre[^>]*>/gi, '\n```\n')
  html = html.replace(/<\/pre>/gi, '\n```\n')
  html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, url, text) => {
    const cleaned = text.replace(/<[^>]*>/g, '').trim()
    return cleaned ? `[${cleaned}](${url})` : url
  })
  html = html.replace(/<a\s+(?:[^>]*?\s+)?href='([^']*)'[^>]*>([\s\S]*?)<\/a>/gi, (_, url, text) => {
    const cleaned = text.replace(/<[^>]*>/g, '').trim()
    return cleaned ? `[${cleaned}](${url})` : url
  })
  html = html.replace(/<[^>]*>/g, '')
  html = html.replace(/&(?:amp|lt|gt|quot|#39|nbsp|#x27|#x60|#x2F);/g, (m: string) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&#x27;': "'", '&#x60;': '`', '&#x2F;': '/' })[m] || m)
  html = html.replace(/\n{4,}/g, '\n\n\n')
  html = html.replace(/[ \t]+/g, ' ')
  html = html.replace(/^\s*[\r\n]+/gm, '')
  return html.trim()
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


