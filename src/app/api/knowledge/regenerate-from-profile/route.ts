/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit } from "@/lib/rate-limit"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

const supabaseAdmin = createAdminClient()

const PROFILE_SOURCE_LABEL = "Business Profile (auto-generated)"

function profileSectionToText(businessProfile: any, tag: string): string | null {
  const bp = { ...((businessProfile?.suggestion as any) || {}), ...businessProfile }

  switch (tag) {
    case "services": {
      const contact = bp.contact || {}
      const parts: string[] = []
      if (bp.description) parts.push(bp.description)
      if (contact.phone) parts.push(`Phone: ${contact.phone}`)
      if (contact.email) parts.push(`Email: ${contact.email}`)
      return parts.length > 0 ? parts.join("\n") : null
    }
    case "faqs": {
      const policies = bp.policies || {}
      const parts: string[] = []
      for (const [key, val] of Object.entries(policies)) {
        if (val) parts.push(`Q: ${key}\nA: ${val}`)
      }
      return parts.length > 0 ? parts.join("\n\n") : null
    }
    case "policies": {
      const policies = bp.policies || {}
      const parts: string[] = Object.entries(policies).map(([k, v]) => `${k}: ${v}`)
      return parts.length > 0 ? parts.join("\n") : null
    }
    case "contact": {
      const c = bp.contact || {}
      const parts: string[] = []
      if (c.phone) parts.push(`Phone: ${c.phone}`)
      if (c.email) parts.push(`Email: ${c.email}`)
      if (c.address) parts.push(`Address: ${c.address}`)
      if (c.google_maps_link) parts.push(`Google Maps: ${c.google_maps_link}`)
      return parts.length > 0 ? parts.join("\n") : null
    }
    case "location": {
      const c = bp.contact || {}
      if (c.address) return `Address: ${c.address}`
      if (c.google_maps_link) return `Google Maps: ${c.google_maps_link}`
      return null
    }
    case "pricing": {
      const p = bp.pricing || {}
      const parts: string[] = []
      if (p.description) parts.push(`Pricing: ${p.description}`)
      if (p.currency) parts.push(`Currency: ${p.currency}`)
      return parts.length > 0 ? parts.join("\n") : null
    }
    case "about": {
      if (bp.description) return bp.description
      return null
    }
    case "amenities": {
      const amenities: string[] = bp.amenities || []
      if (amenities.length > 0) return `Amenities: ${amenities.join(", ")}`
      return null
    }
    case "hours": {
      const h = bp.hours || {}
      const daily = h.daily || h
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      const parts: string[] = []
      for (const day of days) {
        const d = daily[day]
        if (d) {
          if (d.closed) parts.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`)
          else parts.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${d.open || "09:00"} - ${d.close || "17:00"}`)
        }
      }
      return parts.length > 0 ? parts.join("\n") : null
    }
    case "specials": {
      const extras = bp.extras || {}
      const specials = extras.specials || extras.offers || extras.promotions
      if (specials && Array.isArray(specials)) return specials.join("\n")
      if (specials && typeof specials === "string") return specials
      return null
    }
    default:
      return null
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { workspace_id } = await req.json()
    if (!workspace_id || typeof workspace_id !== "string") {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    // Verify user via cookies
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const userWsId = await getUserWorkspaceId(supabase, user.id)
    if (!userWsId || userWsId !== workspace_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use admin client for DB operations (bypass RLS)
    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("business_profile, business_type")
      .eq("id", workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const businessProfile = workspace.business_profile || {}
    const businessType = workspace.business_type || "general"

    const { data: templates } = await supabaseAdmin
      .from("required_info_templates")
      .select("*")
      .in("business_type", ["*", businessType])
      .order("priority", { ascending: true })

    const profileTags = (templates || [])
      .filter((t: any) => t.section === "knowledge_base")
      .map((t: any) => t.field_key)

    const allTags = [...new Set<string>(["services", "faqs", "contact", "location", "pricing", "about", "amenities", "hours", "specials", ...(profileTags || [])])]

    const sections: { tag: string; content: string }[] = []
    for (const tag of allTags) {
      const content = profileSectionToText(businessProfile, tag)
      if (content) sections.push({ tag, content })
    }

    if (sections.length === 0) {
      return NextResponse.json({ error: "No profile data to generate chunks from. Fill in your business profile first." }, { status: 400 })
    }

    // Find or create a profile source row
    let sourceId: string | null = null
    const { data: existingSource } = await supabaseAdmin
      .from("kb_sources")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("label", PROFILE_SOURCE_LABEL)
      .is("deleted_at", null)
      .maybeSingle()

    if (existingSource) {
      sourceId = existingSource.id
    } else {
      const { data: newSource, error: insertErr } = await supabaseAdmin
        .from("kb_sources")
        .insert({
          workspace_id,
          label: PROFILE_SOURCE_LABEL,
          source_type: "profile",
          status: "processing",
        })
        .select()
        .single()
      if (insertErr) {
        console.error("[SYNC] Source insert error:", insertErr)
        return NextResponse.json({ error: `Failed to create source: ${insertErr.message}` }, { status: 500 })
      }
      if (newSource) sourceId = newSource.id
    }

    if (!sourceId) {
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 })
    }

    // Delete old auto-generated chunks BEFORE inserting new ones (prevents duplicates)
    await supabaseAdmin
      .from("kb_chunks")
      .delete()
      .eq("workspace_id", workspace_id)
      .eq("source_id", sourceId)
      .filter("metadata->>source", "eq", "auto-generated")

    // Insert each section as a chunk with null embedding
    const rows = sections.map((s, i) => ({
      workspace_id,
      source_id: sourceId,
      content: s.content,
      embedding: null,
      chunk_index: i,
      token_count: Math.ceil(s.content.length / 4),
      metadata: { tag: s.tag, source: "auto-generated", generated_at: new Date().toISOString() },
    }))

    const { error: insertError } = await supabaseAdmin
      .from("kb_chunks")
      .insert(rows)

    if (insertError) {
      console.error("[REGENERATE] Insert error:", insertError)
      return NextResponse.json({ error: "Failed to save chunks" }, { status: 500 })
    }

    // Kick off embedding — first batch
    await supabaseAdmin.functions.invoke("embed-text", {
      body: { source_id: sourceId, workspace_id, embed_batch: true }
    })

    // Poll until all chunks are embedded (source status becomes 'active' or 'failed')
    let status = "processing"
    let attempts = 0
    const maxWaitMs = 15000
    const startTime = Date.now()
    while (status === "processing" && attempts < 20 && (Date.now() - startTime) < maxWaitMs) {
      await new Promise(r => setTimeout(r, 1000))
      const { data: src } = await supabaseAdmin
        .from("kb_sources")
        .select("status, error_message")
        .eq("id", sourceId)
        .single()
      status = src?.status || "processing"
      attempts++
    }

    const { count: finalChunks } = await supabaseAdmin
      .from("kb_chunks")
      .select("id", { count: "exact", head: true })
      .eq("source_id", sourceId)
      .is("deleted_at", null)

    return NextResponse.json({
      success: true,
      chunks_created: finalChunks || rows.length,
      source_id: sourceId,
      tags: sections.map(s => s.tag),
      embedded: status === "active",
    })
  } catch (err: any) {
    console.error("[REGENERATE] Error:", err)
    return NextResponse.json({ error: "Failed to regenerate from profile" }, { status: 500 })
  }
}
