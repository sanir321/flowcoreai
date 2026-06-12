import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    const publishableKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || ''
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token || !(token === serviceRoleKey || token === internalSecret || publishableKeys.includes(token))) {
      const verifyClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey ?? '')
      const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey ?? '')
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
      text = await extractContentWithOpenCode(html, opencodeKey)
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

async function extractContentWithOpenCode(html: string, apiKey: string): Promise<string> {
  const stripped = convertHtmlToText(html)
  const baseUrl = Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1"

  if (stripped.length < 50) return stripped

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nemotron-3-ultra-free",
      messages: [
        {
          role: "system",
          content: "You are a web content extractor. Given raw website text, extract the main body content: remove navigation menus, sidebars, footers, header banners, cookie notices, ads, and boilerplate. Preserve the core article or page content — headings, paragraphs, lists, tables — in clean readable text. Return ONLY the extracted content, no commentary."
        },
        {
          role: "user",
          content: `Extract the main content from this website text. Return only the cleaned text:\n\n${stripped.slice(0, 25000)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 16000,
    }),
  })

  if (!response.ok) {
    console.error("[OpenCodeURL] API error:", response.status)
    return stripped
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content
  return (content && content.length > 10) ? content : stripped
}

function convertHtmlToText(html: string): string {
  html = html.replace(/<(script|style|svg|noscript|nav|footer|header|aside|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
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
  html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
  html = html.replace(/<a\s+(?:[^>]*?\s+)?href='([^']*)'[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
  html = html.replace(/<[^>]*>/g, '')
  html = html.replace(/&(?:amp|lt|gt|quot|#39|nbsp|#x27|#x60|#x2F);/g, (m: string) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&#x27;': "'", '&#x60;': '`', '&#x2F;': '/' })[m] || m)
  html = html.replace(/\n{3,}/g, '\n\n')
  html = html.replace(/[ \t]+/g, ' ')
  return html.trim()
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

function fireAndForget(supabase: any, functionName: string, body: object) {
  const secret = Deno.env.get('INTERNAL_CRON_SECRET')
  supabase.functions.invoke(functionName, { body, headers: { Authorization: `Bearer ${secret}` } }).catch(() => {})
}
