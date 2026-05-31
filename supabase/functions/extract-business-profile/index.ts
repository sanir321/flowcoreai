import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceKey
    )

    const { workspace_id, source_id } = await req.json()
    if (!workspace_id || !source_id) {
      throw new Error("workspace_id and source_id are required")
    }

    // Get all chunks for this source
    const { data: chunks, error: chunkError } = await supabase
      .from("kb_chunks")
      .select("content")
      .eq("source_id", source_id)
      .eq("workspace_id", workspace_id)
      .order("chunk_index", { ascending: true })

    if (chunkError) throw new Error(`Failed to read chunks: ${chunkError.message}`)
    if (!chunks || chunks.length === 0) {
      console.log(`[ExtractBP] No chunks found for source ${source_id}, skipping`)
      return new Response(JSON.stringify({ skipped: true, reason: "no_chunks" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Get workspace business_type and existing profile
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("business_type, business_profile")
      .eq("id", workspace_id)
      .single()

    if (wsError) throw new Error(`Failed to read workspace: ${wsError.message}`)

    const businessType = workspace?.business_type || "hotel"
    const existingProfile = (workspace?.business_profile || {}) as Record<string, unknown>

    // Join all chunks into full text (first 15000 chars to fit context window)
    const fullText = chunks.map(c => c.content).join("\n\n").slice(0, 15000)

    const groqKey = Deno.env.get("GROQ_API_KEY")
    if (!groqKey) {
      console.log("[ExtractBP] No GROQ_API_KEY, skipping")
      return new Response(JSON.stringify({ skipped: true, reason: "no_groq_key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Extract structured data via Groq
    const extracted = await extractBusinessProfile(fullText, businessType, groqKey)

    if (!extracted || Object.keys(extracted).length === 0) {
      console.log("[ExtractBP] No data extracted")
      return new Response(JSON.stringify({ skipped: true, reason: "no_data_extracted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Merge extracted data with existing profile
    const merged = mergeProfiles(existingProfile, extracted)

    await supabase
      .from("workspaces")
      .update({ business_profile: merged, updated_at: new Date().toISOString() })
      .eq("id", workspace_id)

    console.log(`[ExtractBP] Updated business profile for workspace ${workspace_id}`)

    return new Response(JSON.stringify({ success: true, extracted: Object.keys(extracted) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error("[ExtractBP]", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

async function extractBusinessProfile(text: string, businessType: string, apiKey: string): Promise<Record<string, unknown>> {
  const prompt = `Extract structured business information from the website text below. Return ONLY valid JSON matching this schema (all fields optional — omit if not found):

{
  "contact": { "phone": "...", "email": "...", "address": "...", "google_maps_link": "..." },
  "social": { "instagram": "...", "facebook": "...", "twitter": "..." },
  "hours": { "daily": { "monday": { "open": "09:00", "close": "18:00", "closed": false }, ...all days } },
  "policies": { "cancellation": "...", "pets": "...", "smoking": "...", "children": "...", "payment": "..." },
  "amenities": ["wifi", "parking", "pool", ...],
  "pricing": { "description": "e.g. Rooms from ₹8,000/night", "currency": "INR" },
  "extras": {
    "check_in": "14:00",
    "check_out": "11:00",
    "rooms": [{ "name": "Deluxe Room", "base_rate": 8000, "currency": "INR", "description": "..." }],
    "cuisine": "...",
    "specialties": ["...", "..."],
    "services": ["...", "..."],
    "class_types": ["...", "..."],
    "product_categories": ["...", "..."],
    "property_types": ["...", "..."],
    "store_type": "...",
    "seating_capacity": 80,
    "booking_notice": 24,
    "appointment_duration": 30
  }
}

Business type: "${businessType}"

Rules:
1. Only include fields that you found on the website
2. Use empty string or empty array for missing fields — don't make up data
3. Hours should use 24h format (HH:MM)
4. Convert all amenity names to lowercase with underscores (e.g. "Free WiFi" → "wifi")
5. For room rates, include name, base_rate (number), currency, description
6. For extract fields, only include ones relevant to this business type
7. phone numbers should be stripped of non-digit characters except leading +
8. email addresses should be lowercase

Website text:
${text.slice(0, 14000)}`

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You extract structured business data from website content. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error: ${response.status} ${errText}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    console.log("[ExtractBP] Empty Groq response")
    return {}
  }

  try {
    return JSON.parse(content)
  } catch {
    console.error("[ExtractBP] Failed to parse Groq response as JSON")
    return {}
  }
}

function mergeProfiles(existing: Record<string, unknown>, extracted: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...existing }

  for (const [key, val] of Object.entries(extracted)) {
    if (!val) continue

    const existingVal = merged[key]

    if (!existingVal || isEmpty(existingVal as any)) {
      merged[key] = val
      continue
    }

    // For objects, merge individual fields (don't overwrite non-empty existing fields)
    if (typeof val === "object" && !Array.isArray(val) && val !== null) {
      if (typeof existingVal === "object" && !Array.isArray(existingVal) && existingVal !== null) {
        const mergedObj = { ...(existingVal as Record<string, unknown>) }
        for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
          if (isEmpty(subVal as any)) continue
          const existingSubVal = (existingVal as Record<string, unknown>)[subKey]
          if (!existingSubVal || isEmpty(existingSubVal as any)) {
            mergedObj[subKey] = subVal
          }
        }
        merged[key] = mergedObj
      } else {
        merged[key] = { ...(existingVal as Record<string, unknown> || {}), ...(val as Record<string, unknown>) }
      }
    }
  }

  return merged
}

function isEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return true
  if (typeof val === "string") return val.trim() === ""
  if (Array.isArray(val)) return val.length === 0
  if (typeof val === "object" && !Array.isArray(val)) return Object.values(val as Record<string, unknown>).every(v => v === "" || v === null || v === undefined || v === 0)
  return false
}