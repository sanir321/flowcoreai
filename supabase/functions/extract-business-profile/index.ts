import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const cronSecret = Deno.env.get("INTERNAL_CRON_SECRET") || ""

    if (!token || (token !== serviceKey && token !== cronSecret)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceKey
    )

    const { workspace_id, source_id } = await req.json()
    if (!workspace_id || !source_id) {
      throw new Error("workspace_id and source_id are required")
    }

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

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("business_type, business_profile")
      .eq("id", workspace_id)
      .single()

    if (wsError) throw new Error(`Failed to read workspace: ${wsError.message}`)

    const businessType = workspace?.business_type || "hotel"
    const existingProfile = (workspace?.business_profile || {}) as Record<string, unknown>

    const fullText = chunks.map(c => c.content).join("\n\n").slice(0, 15000)

    const groqKey = Deno.env.get("GROQ_API_KEY")
    if (!groqKey) {
      console.log("[ExtractBP] No GROQ_API_KEY, skipping")
      return new Response(JSON.stringify({ skipped: true, reason: "no_groq_key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const extracted = await extractBusinessProfile(fullText, businessType, groqKey)

    if (!extracted || Object.keys(extracted).length === 0) {
      console.log("[ExtractBP] No data extracted")
      return new Response(JSON.stringify({ skipped: true, reason: "no_data_extracted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const merged = mergeProfiles(existingProfile, extracted)

    const { error: updateError } = await supabase
      .from("workspaces")
      .update({ business_profile: merged, updated_at: new Date().toISOString() })
      .eq("id", workspace_id)

    if (updateError) throw new Error(`Failed to update workspace: ${updateError.message}`)

    console.log(`[ExtractBP] Updated business profile for workspace ${workspace_id} from source ${source_id}`)

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
  const prompt = `Extract structured business information from the website text below. Return ONLY valid JSON.

Business type: "${businessType}"

For a ${businessType}, extract ALL available information into this shape:

{
  "contact": { "phone": "...", "email": "...", "address": "..." },
  "social": { "instagram": "...", "facebook": "...", "twitter": "..." },
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
        { role: "system", content: "You extract structured business data from website content. Return only valid JSON. Omit fields that are not found — do not include empty strings or arrays." },
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
