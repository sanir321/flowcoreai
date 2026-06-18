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
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    const publishableKeys = (Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '').split(',').filter(Boolean)
    if (token && (token === serviceRoleKey || token === internalSecret || publishableKeys.includes(token))) {
      // Authorized via key match
    } else {
      const { data: { user }, error: authError } = await createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey ?? ''
      ).auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? ''
    )

    const { workspace_id, source_id, content, embed_batch, tag } = await req.json()

    // ── Mode 2: embed a batch of pending (null-embedding) chunks ──
    // Each batch runs in its own worker invocation so the gte-small CPU budget
    // resets; embedding the whole document in one invocation hits WORKER_RESOURCE_LIMIT.
    if (embed_batch) {
      if (!source_id) {
        return new Response(JSON.stringify({ error: 'source_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const result = await embedPendingBatch(supabase, source_id)
      return new Response(JSON.stringify({ success: true, ...result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Mode 1: chunk content + store rows (no embedding yet), then kick off batches ──
    if (!workspace_id || !source_id || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    await supabase.from('kb_sources').update({
      status: 'processing',
      error_message: 'Chunking content...'
    }).eq('id', source_id)

    const chunks = splitIntoChunks(content, 1500)

    const { error: deleteError } = await supabase
      .from('kb_chunks')
      .delete()
      .eq('source_id', source_id)
    if (deleteError) throw new Error("Failed to clear old chunks")

    const rows = chunks.map((c, i) => ({
      workspace_id,
      source_id,
      content: c,
      embedding: null,
      chunk_index: i,
      token_count: Math.ceil(c.length / 4),
      metadata: tag ? { tag } : {}
    }))

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('kb_chunks').insert(rows)
      if (insertError) throw new Error("Failed to save chunks")
    }

    await supabase.from('kb_sources').update({
      error_message: `Embedding 0/${rows.length}...`
    }).eq('id', source_id)

    triggerEmbedBatch(supabase, source_id, workspace_id)

    return new Response(JSON.stringify({ success: true, chunks: rows.length, embedding: 'started' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error(error)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { source_id } = await req.clone().json().catch(() => ({}))
      if (source_id) {
        await supabase.from('kb_sources').update({
          status: 'failed',
          error_message: "Embedding failed"
        }).eq('id', source_id)
      }
    } catch {}

    return new Response(JSON.stringify({ error: 'Text embedding failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

function splitIntoChunks(text: string, maxSize: number): string[] {
  const HARD_CAP = Math.round(maxSize * 1.5)

  const headingInfo = findHeadings(text)
  if (headingInfo.length === 0) {
    return splitByParagraphs(text, maxSize, HARD_CAP)
  }

  const lines = text.split('\n')
  const chunks: string[] = []
  for (let i = 0; i < headingInfo.length; i++) {
    const startLine = headingInfo[i].lineIndex
    const endLine = i + 1 < headingInfo.length ? headingInfo[i + 1].lineIndex : lines.length
    const section = lines.slice(startLine, endLine).join('\n').trim()
    if (!section) continue

    if (section.length <= maxSize) {
      chunks.push(section)
    } else {
      chunks.push(...splitByParagraphs(section, maxSize, HARD_CAP))
    }
  }

  const filtered = chunks.filter(isMeaningfulChunk)
  return filtered.length > 0 ? filtered : [text.slice(0, HARD_CAP)]
}

function findHeadings(text: string): { lineIndex: number }[] {
  const lines = text.split('\n')
  const headings: { lineIndex: number }[] = []
  let inCode = false
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('```')) { inCode = !inCode; continue }
    if (!inCode && /^#{1,6}\s+\S/.test(trimmed)) {
      headings.push({ lineIndex: i })
    }
  }
  return headings
}

function splitByParagraphs(text: string, maxSize: number, hardCap: number): string[] {
  const paras = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  if (paras.length <= 1) return splitBySentences(text, maxSize, hardCap)

  const chunks: string[] = []
  let current = ""
  for (const para of paras) {
    const candidate = current ? current + '\n\n' + para : para
    if (candidate.length > maxSize && current) {
      chunks.push(current)
      current = para
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)

  return chunks.flatMap(c => c.length > hardCap ? splitBySentences(c, maxSize, hardCap) : [c])
}

function splitBySentences(text: string, maxSize: number, hardCap: number): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text]
  const chunks: string[] = []
  let current = ""
  for (const s of sentences) {
    const candidate = current ? current + s : s
    if (candidate.length > maxSize && current) {
      chunks.push(current.trim())
      current = s
    } else {
      current = candidate
    }
    while (current.length > hardCap) {
      chunks.push(current.slice(0, hardCap).trim())
      current = current.slice(hardCap)
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function isMeaningfulChunk(chunk: string): boolean {
  const informative = chunk.replace(/[-|#*`>\s\d.]/g, "")
  if (informative.length < 40) return false
  const alnum = (chunk.match(/[a-zA-Z0-9]/g) || []).length
  if (alnum / chunk.length < 0.4) return false
  return true
}

// Embed up to BATCH null-embedding chunks for a source. Each call runs in its own
// worker invocation so the gte-small CPU budget resets between batches.
const BATCH = 3
async function embedPendingBatch(supabase: any, source_id: string) {
  const { data: pending, error: selErr } = await supabase
    .from('kb_chunks')
    .select('id, content')
    .eq('source_id', source_id)
    .is('embedding', null)
    .order('chunk_index', { ascending: true })
    .limit(BATCH)
  if (selErr) throw new Error("Failed to load pending chunks")

  for (const row of pending || []) {
    try {
      const embedding = await model.run(row.content, { mean_pool: true, normalize: true })
      await supabase.from('kb_chunks').update({ embedding: Array.from(embedding) }).eq('id', row.id)
    } catch (e) {
      // Drop the offending chunk so it can't stall the batch loop forever.
      console.error('[embedPendingBatch] embed failed for chunk', row.id, e)
      await supabase.from('kb_chunks').delete().eq('id', row.id)
    }
  }

  const { count: remaining } = await supabase
    .from('kb_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', source_id)
    .is('embedding', null)

  const { count: total } = await supabase
    .from('kb_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', source_id)

  if ((remaining || 0) > 0) {
    const done = (total || 0) - (remaining || 0)
    await supabase.from('kb_sources').update({
      error_message: `Embedding ${done}/${total || 0}...`
    }).eq('id', source_id)
    triggerEmbedBatch(supabase, source_id)
    return { done, total: total || 0, remaining }
  }

  // All chunks embedded — finalize.
  await supabase.from('kb_sources').update({
    status: 'active',
    chunk_count: total || 0,
    error_message: null,
    updated_at: new Date().toISOString()
  }).eq('id', source_id)
  await supabase.from('ingestion_jobs').update({ status: 'completed' }).eq('source_id', source_id)

  return { done: total || 0, total: total || 0, remaining: 0, completed: true }
}

// Fire-and-forget self-invocation to embed the next batch in a fresh worker.
function triggerEmbedBatch(supabase: any, source_id: string, workspace_id?: string) {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const baseUrl = Deno.env.get('SUPABASE_URL')
  if (!anonKey || !baseUrl) {
    console.error('[triggerEmbedBatch] missing SUPABASE_ANON_KEY or SUPABASE_URL')
    return
  }
  fetch(`${baseUrl}/functions/v1/embed-text`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'apikey': anonKey,
    },
    body: JSON.stringify({ source_id, workspace_id, embed_batch: true }),
  })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then(() => {})
    .catch((err: any) => {
      console.error('[triggerEmbedBatch] failed:', err?.message || err)
      supabase.from('kb_sources').update({
        status: 'failed',
        error_message: 'Embedding batch failed to continue'
      }).eq('id', source_id).then(() => {}, () => {})
    })
}
