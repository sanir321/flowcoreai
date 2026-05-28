import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SSRF blocklist: internal/private IP ranges
const PRIVATE_CIDRS = [
  { prefix: [10], mask: 8 },           // 10.0.0.0/8
  { prefix: [172, 16], mask: 12 },      // 172.16.0.0/12
  { prefix: [192, 168], mask: 16 },     // 192.168.0.0/16
  { prefix: [127], mask: 8 },           // 127.0.0.0/8
  { prefix: [169, 254], mask: 16 },     // 169.254.0.0/16
  { prefix: [0], mask: 8 },             // 0.0.0.0/8
  { prefix: [100, 64], mask: 10 },      // 100.64.0.0/10 (CGNAT)
]

function isPrivateIP(hostname: string): boolean {
  try {
    // Resolve hostname to IP addresses via DNS
    // Since Deno doesn't have dns.lookup, parse IP directly
    const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    if (!isIPv4) return false // hostnames pass, IPs are checked
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
  } catch { return true } // deny on resolve failure
}

function validateUrl(raw: string): URL {
  let url: URL
  try { url = new URL(raw) } catch { throw new Error('Invalid URL format') }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS URLs are allowed')
  if (isPrivateIP(url.hostname)) throw new Error(`Access to ${url.hostname} is not allowed`)
  return url
}

// Initialize the local embedding model — loaded once, reused across invocations
const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Auth: verify JWT, internal secret, or service role key (server action)
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!token || (token !== internalSecret && token !== serviceRoleKey)) {
      const verifyClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey ?? ''
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

    const { workspace_id, source_id, url: rawUrl } = await req.json()

    // SSRF GUARD: validate URL before any network operation
    const url = validateUrl(rawUrl)

    // 0. Update status to processing
    await supabase.from('kb_sources').update({ 
      status: 'processing',
      error_message: 'Fetching website content...' 
    }).eq('id', source_id)

    // 1. Fetch and process URL (with timeout)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`)
    
    const html = await response.text()
    const text = convertHtmlToText(html)
    if (text.length < 10) throw new Error("No meaningful content found on the page.")

    // 2. Chunking
    await supabase.from('kb_sources').update({ error_message: 'Chunking content...' }).eq('id', source_id)
    const chunks = splitIntoChunks(text, 5000)

    // 3. Generate Embeddings via Local Model
    const chunksToInsert = []
    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      
      await supabase.from('kb_sources').update({ 
        error_message: `Embedding chunk ${i + 1}/${chunks.length}...` 
      }).eq('id', source_id)
      
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

    // 4. Update source and jobs
    await supabase.from('kb_sources').update({ error_message: 'Finalizing knowledge base...' }).eq('id', source_id)
    
    if (chunksToInsert.length > 0) {
      const { error: insertError } = await supabase.from('kb_chunks').insert(chunksToInsert)
      if (insertError) throw new Error(`Failed to save chunks: ${insertError.message}`)
    }

    // FINAL GATE: Only set to active if we actually have chunks or the process definitely finished
    const { error: finalError } = await supabase.from('kb_sources').update({ 
      status: 'active', 
      chunk_count: chunks.length,
      error_message: null,
      updated_at: new Date().toISOString()
    }).eq('id', source_id)

    if (finalError) throw new Error(`Failed to activate source: ${finalError.message}`)
    
    await supabase.from('ingestion_jobs').update({ status: 'completed' }).eq('source_id', source_id)

    return new Response(JSON.stringify({ success: true, chunks: chunks.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error(error)
    
    // Attempt to mark as failed in DB
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { source_id } = await req.clone().json().catch(() => ({}))
      if (source_id) {
        await supabase.from('kb_sources').update({ 
          status: 'failed', 
          error_message: error.message 
        }).eq('id', source_id)
      }
    } catch (e) {
      console.error("Failed to update error status:", e)
    }

    return new Response(JSON.stringify({ error: "URL ingestion failed" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

function convertHtmlToText(html: string): string {
  let text = html

  // Remove script and style blocks
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')

  // Remove common noise elements (nav, footer, header, sidebar, etc.)
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
  text = text.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
  text = text.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
  text = text.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')

  // Convert structural elements to markdown-like markers
  // Headings: add # prefix and newlines
  text = text.replace(/<h1[^>]*>/gi, '# ')
  text = text.replace(/<\/h1>/gi, '\n\n')
  text = text.replace(/<h2[^>]*>/gi, '## ')
  text = text.replace(/<\/h2>/gi, '\n\n')
  text = text.replace(/<h3[^>]*>/gi, '### ')
  text = text.replace(/<\/h3>/gi, '\n\n')
  text = text.replace(/<h4[^>]*>/gi, '#### ')
  text = text.replace(/<\/h4>/gi, '\n\n')
  text = text.replace(/<h5[^>]*>/gi, '##### ')
  text = text.replace(/<\/h5>/gi, '\n\n')
  text = text.replace(/<h6[^>]*>/gi, '###### ')
  text = text.replace(/<\/h6>/gi, '\n\n')

  // List items: bullet points
  text = text.replace(/<li[^>]*>/gi, '\n- ')
  text = text.replace(/<\/li>/gi, '')

  // Ordered list items
  text = text.replace(/<ol[^>]*>/gi, '\n')
  text = text.replace(/<\/ol>/gi, '\n')

  // Unordered list
  text = text.replace(/<ul[^>]*>/gi, '\n')
  text = text.replace(/<\/ul>/gi, '\n')

  // Links: [text](url)
  text = text.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
  text = text.replace(/<a\s+(?:[^>]*?\s+)?href='([^']*)'[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')

  // Bold/strong
  text = text.replace(/<(?:strong|b)\b[^>]*>/gi, '**')
  text = text.replace(/<\/(?:strong|b)>/gi, '**')

  // Italic/emphasis
  text = text.replace(/<(?:em|i)\b[^>]*>/gi, '*')
  text = text.replace(/<\/(?:em|i)>/gi, '*')

  // Inline code
  text = text.replace(/<code[^>]*>/gi, '`')
  text = text.replace(/<\/code>/gi, '`')

  // Block code
  text = text.replace(/<pre[^>]*>/gi, '\n```\n')
  text = text.replace(/<\/pre>/gi, '\n```\n')

  // Tables: extract cells with pipe separators
  text = text.replace(/<table[^>]*>/gi, '\n')
  text = text.replace(/<\/table>/gi, '\n')
  text = text.replace(/<tr[^>]*>/gi, '\n')
  text = text.replace(/<\/tr>/gi, '')
  text = text.replace(/<th[^>]*>/gi, '| ')
  text = text.replace(/<\/th>/gi, ' ')
  text = text.replace(/<td[^>]*>/gi, '| ')
  text = text.replace(/<\/td>/gi, ' ')

  // Line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/li>/gi, '')
  text = text.replace(/<\/dd>/gi, '\n')
  text = text.replace(/<\/dt>/gi, '\n')
  text = text.replace(/<\/hgroup>/gi, '\n')

  // Horizontal rules
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n')

  // Strip any remaining HTML tags
  text = text.replace(/<[^>]*>?/g, '')

  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&#x27;/g, "'")
  text = text.replace(/&#x60;/g, '`')
  text = text.replace(/&#x2F;/g, '/')

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/^\s+|\s+$/gm, '')
  text = text.replace(/^[ \t]+\n/gm, '')

  return text.trim()
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
