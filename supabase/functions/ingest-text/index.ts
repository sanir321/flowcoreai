import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('NEXT_PUBLIC_APP_URL') || '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const model = new Supabase.ai.Session("gte-small")

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const legacySrk = Deno.env.get("SERVICE_KEY") || Deno.env.get("LEGACY_SERVICE_ROLE_KEY") || ""
    const secretKeysStr = Deno.env.get("SUPABASE_SECRET_KEYS")
    let secretKeys: string[] = []
    try { const parsed = JSON.parse(secretKeysStr || "{}"); secretKeys = Object.values(parsed) } catch {}
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET")
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    const validTokens = new Set([srk, legacySrk, internalSecret || "", ...secretKeys].filter(Boolean))
    if (!token || !validTokens.has(token)) {
      const verifyClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", srk || legacySrk)
      const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", srk || legacySrk)

    const { workspace_id, text_content, label, source_type } = await req.json()
    if (!workspace_id || !text_content) {
      return new Response(JSON.stringify({ error: "workspace_id and text_content required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const type = source_type || "txt"

    const { data: source, error: srcErr } = await supabase.from("kb_sources").insert({
      workspace_id,
      source_type: type,
      label: label || "Imported text",
      status: "processing",
      chunk_count: 0,
    }).select("id").single()

    if (srcErr || !source) throw new Error(`Failed to create source: ${srcErr?.message}`)
    const sourceId = source.id

    const chunks = splitIntoChunks(text_content, 5000)

    const rows = []
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await model.run(chunks[i], { mean_pool: true, normalize: true })
      rows.push({
        workspace_id,
        source_id: sourceId,
        content: chunks[i],
        embedding: Array.from(embedding),
        chunk_index: i,
        token_count: Math.ceil(chunks[i].length / 4),
      })
    }

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("kb_chunks").insert(rows)
      if (insErr) throw new Error(`Insert failed: ${insErr.message}`)
    }

    await supabase.from("kb_sources").update({
      status: "active",
      chunk_count: chunks.length,
      error_message: null,
    }).eq("id", sourceId)

    return new Response(JSON.stringify({ success: true, source_id: sourceId, chunks: chunks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Text ingestion failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
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
