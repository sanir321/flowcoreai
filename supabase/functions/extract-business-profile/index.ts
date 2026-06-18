import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get('NEXT_PUBLIC_APP_URL') || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const legacySrk = Deno.env.get("SERVICE_KEY") || Deno.env.get("LEGACY_SERVICE_ROLE_KEY") || ""
    const secretKeysStr = Deno.env.get("SUPABASE_SECRET_KEYS")
    let secretKeys: string[] = []
    try { const parsed = JSON.parse(secretKeysStr || '{}'); secretKeys = Object.values(parsed) } catch {}
    const cronSecret = Deno.env.get("INTERNAL_CRON_SECRET") || ""

    const validTokens = new Set([srk, legacySrk, cronSecret, ...secretKeys].filter(Boolean))
    if (!token || !validTokens.has(token)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      srk || legacySrk
    )

    const body = await req.json()
    const { workspace_id, source_id, website_url, mode } = body

    if (website_url && workspace_id) {
      return await processUrl(supabase, workspace_id, website_url)
    }

    if (mode === "batch" || (!workspace_id && !source_id)) {
      return await processBatch(supabase)
    }

    if (!workspace_id || !source_id) {
      throw new Error("Provide workspace_id + source_id, website_url + workspace_id, or mode: 'batch'")
    }

    return await processSingle(supabase, workspace_id, source_id)
  } catch (error: any) {
    console.error("[ExtractBP] Top-level error")
    return new Response(JSON.stringify({ error: "Failed to extract business profile" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

async function processBatch(supabase: any): Promise<Response> {
  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name, business_type, business_profile")

  if (wsError) throw new Error(`Failed to list workspaces: ${wsError.message}`)
  if (!workspaces || workspaces.length === 0) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_workspaces" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const opencodeKey = Deno.env.get("OPENCODE_ZEN_API_KEY")
  if (!opencodeKey) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_opencode_key" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const results: { workspace: string; status: string; fields?: string[] }[] = []

  for (const ws of workspaces) {
    const { data: sources, error: srcError } = await supabase
      .from("kb_sources")
      .select("id, source_type, bp_extracted_fields, created_at")
      .eq("workspace_id", ws.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5)

    if (srcError) {
      console.error(`[Batch] Error fetching sources: ${srcError.message}`)
      results.push({ workspace: ws.id, status: "error" })
      continue
    }

    if (!sources || sources.length === 0) {
      results.push({ workspace: ws.id, status: "skip_no_sources" })
      continue
    }

    const { data: chunks, error: chunkError } = await supabase
      .from("kb_chunks")
      .select("content")
      .eq("workspace_id", ws.id)
      .limit(1)

    if (chunkError || !chunks || chunks.length === 0) {
      results.push({ workspace: ws.id, status: "skip_no_chunks" })
      continue
    }

    const bp = ws.business_profile as Record<string, unknown> || {}
    const hasSocial = bp.social && !isEmpty(bp.social)
    const hasContact = bp.contact && !isEmpty(bp.contact)
    const hasExtras = bp.extras && !isEmpty(bp.extras)
    if (hasSocial && hasContact && hasExtras) {
      results.push({ workspace: ws.id, status: "skip_already_complete" })
      continue
    }

    const unextracted = (sources as any[]).find(s => {
      const fields = s.bp_extracted_fields as string[] || []
      return fields.length === 0
    })
    const bestSource = unextracted || sources[0]
    if (!bestSource) {
      results.push({ workspace: ws.id, status: "skip_no_new_source" })
      continue
    }

    const sourceResult = await processSingle(supabase, ws.id, bestSource.id)
    const data = await sourceResult.json()
    results.push({
      workspace: ws.id,
      status: data.skipped ? "skipped" : "done",
      fields: data.extracted,
    })
  }

  return new Response(JSON.stringify({ batch: true, total: workspaces.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

async function processSingle(supabase: any, workspace_id: string, source_id: string): Promise<Response> {
  const { data: chunks, error: chunkError } = await supabase
    .from("kb_chunks")
    .select("content")
    .eq("source_id", source_id)
    .eq("workspace_id", workspace_id)
    .order("chunk_index", { ascending: true })

  if (chunkError) throw new Error(`Failed to read chunks: ${chunkError.message}`)
  if (!chunks || chunks.length === 0) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_chunks" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("business_type, business_profile")
    .eq("id", workspace_id)
    .single()

  if (wsError) throw new Error(`Failed to read workspace: ${wsError.message}`)

  const businessType = workspace?.business_type || "construction_company"
  const existingProfile = (workspace?.business_profile || {}) as Record<string, unknown>

  const fullText = chunks.map(c => c.content).join("\n\n").slice(0, 20000)

  const parsedSocial = parseSocialUrls(fullText)

  const opencodeKey = Deno.env.get("OPENCODE_ZEN_API_KEY")
  if (!opencodeKey) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_opencode_key" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const extracted = await extractBusinessProfile(fullText, businessType, opencodeKey)

  if (parsedSocial && Object.keys(parsedSocial).length > 0) {
    extracted.social = { ...(extracted.social as Record<string, string> || {}), ...parsedSocial }
  }

  if (!extracted || Object.keys(extracted).length === 0) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_data_extracted" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const merged = mergeProfiles(existingProfile, extracted)

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({ business_profile: merged, updated_at: new Date().toISOString() })
    .eq("id", workspace_id)

  if (updateError) throw new Error(`Failed to update workspace: ${updateError.message}`)

  const extractedFields = Object.keys(extracted)
  const { error: fieldsError } = await supabase
    .from("kb_sources")
    .update({ bp_extracted_fields: extractedFields })
    .eq("id", source_id)

  if (fieldsError) {
    console.error(`[ExtractBP] Failed to update bp_extracted_fields: ${fieldsError.message}`)
  }

  return new Response(JSON.stringify({ success: true, extracted: extractedFields }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

async function processUrl(supabase: any, workspace_id: string, website_url: string): Promise<Response> {
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("business_type, business_profile")
    .eq("id", workspace_id)
    .single()

  if (wsError) throw new Error(`Failed to read workspace: ${wsError.message}`)

  const businessType = workspace?.business_type || "construction_company"
  const existingProfile = (workspace?.business_profile || {}) as Record<string, unknown>

  const pageResp = await fetch(website_url, {
    headers: { "User-Agent": "FlowCore/1.0 (Business Profile Extractor)" },
    signal: AbortSignal.timeout(15000),
  })

  if (!pageResp.ok) {
    return new Response(JSON.stringify({ skipped: true, reason: "fetch_failed", status: pageResp.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const html = await pageResp.text()
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000)

  if (text.length < 50) {
    return new Response(JSON.stringify({ skipped: true, reason: "text_too_short" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const opencodeKey = Deno.env.get("OPENCODE_ZEN_API_KEY")
  if (!opencodeKey) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_opencode_key" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const extracted = await extractBusinessProfile(text, businessType, opencodeKey)
  if (!extracted || Object.keys(extracted).length === 0) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_data_extracted" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  // Store in suggestion sub-object — never overwrite manual edits
  const existingSuggestions = (existingProfile.suggestion || {}) as Record<string, unknown>
  const merged = {
    ...existingProfile,
    suggestion: {
      ...existingSuggestions,
      scraped_at: new Date().toISOString(),
      source: website_url,
      ...extracted,
    },
  }

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({ business_profile: merged, updated_at: new Date().toISOString() })
    .eq("id", workspace_id)

  if (updateError) throw new Error(`Failed to update workspace: ${updateError.message}`)

  const extractedFields = Object.keys(extracted)
  return new Response(JSON.stringify({ success: true, extracted: extractedFields, source: "url" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
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

async function extractBusinessProfile(text: string, businessType: string, apiKey: string): Promise<Record<string, unknown>> {
  const baseUrl = Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1"
  const prompt = `Extract structured business information from the website text below. Return ONLY valid JSON.

Business type: "${businessType}"

For a ${businessType}, extract ALL available information into this shape:

{
  "contact": { "phone": "...", "email": "...", "address": "..." },
  "social": { "instagram": "...", "facebook": "...", "twitter": "...", "linkedin": "...", "youtube": "...", "pinterest": "..." },
  "hours": { "daily": { "monday": { "open": "09:00", "close": "18:00", "closed": false }, "tuesday": {...}, ...all 7 days } },
  "policies": { "cancellation": "...", "pets": "...", "smoking": "...", "children": "...", "payment": "..." },
  "amenities": ["wifi", "parking", "pool", ...],
  "pricing": { "description": "e.g. Rooms from ₹8,000/night", "currency": "INR" },
  "extras": {
    "check_in": "14:00",
    "check_out": "11:00",
    "rooms": [{ "name": "Deluxe Room", "description": "...", "base_rate": 8000, "currency": "INR" }],
    "cuisine": "e.g. Goan, Indian, Chinese",
    "specialties": ["general_dentistry", "orthodontic_treatment", ...],
    "services": ["spa", "dining", "banqueting", ...],
    "class_types": ["yoga", "pilates", ...],
    "product_categories": ["skincare", "haircare", ...],
    "property_types": ["apartment", "villa", ...],
    "store_type": "boutique",
    "seating_capacity": 80,
    "booking_notice": 24,
    "appointment_duration": 30
  }
}

Rules:
1. Extract ONLY information that is explicitly present in the text. Do NOT invent or assume.
2. For fields not found, OMIT them from the JSON entirely (don't include empty strings or arrays).
3. Hours: use 24h format (HH:MM). If a day's hours aren't listed, omit that day. If no hours at all, omit "hours" entirely.
4. Amenities: use lowercase with underscores (e.g. "Free WiFi" → "wifi", "Swimming Pool" → "pool")
5. Phone numbers: strip all non-digit characters except leading +
6. Email addresses: lowercase
7. Room rates: include name, description, base_rate as a number, and currency
8. For restaurants: include cuisine, seating_capacity
9. For hotels: include check_in, check_out, rooms, amenities
10. For dental clinics: include specialties, services, appointment_duration

Website text:
${text.slice(0, 19000)}`

  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nemotron-3-ultra-free",
        messages: [
          { role: "system", content: "You extract structured business data from website content. Return only valid JSON. Omit fields that are not found — do not include empty strings or arrays." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errText = await response.text()
    console.error(`[ExtractBP] OpenCode API error: ${response.status} ${errText}`)
    throw new Error(`OpenCode API error: ${response.status} ${errText}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    return {}
  }

  try {
    return JSON.parse(content)
  } catch (e) {
    console.error("[ExtractBP] Failed to parse OpenCode response as JSON:", e, "Content:", content.slice(0, 500))
    return {}
  }
}

function mergeProfiles(existing: Record<string, unknown>, extracted: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...existing }

  for (const [key, val] of Object.entries(extracted)) {
    if (val == null || isEmpty(val)) continue
    merged[key] = val
  }

  return merged
}

function isEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return true
  if (typeof val === "string") return val.trim() === ""
  if (typeof val === "boolean") return val === false
  if (typeof val === "number") return val === 0
  if (Array.isArray(val)) return val.length === 0
  if (typeof val === "object") return Object.values(val as Record<string, unknown>).every(v => isEmpty(v))
  return false
}
