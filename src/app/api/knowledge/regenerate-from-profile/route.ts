/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { workspace_id } = await req.json()
    if (!workspace_id || typeof workspace_id !== "string") {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(
      req.headers.get("Authorization")?.replace("Bearer ", "") || ""
    )
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userWsId = user.app_metadata?.workspace_id
    if (!userWsId || userWsId !== workspace_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("business_profile, business_type")
      .eq("id", workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const businessProfile = workspace.business_profile || {}
    const businessType = workspace.business_type || "hotel"

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

    // Delete old auto-generated chunks
    await supabaseAdmin
      .from("kb_chunks")
      .delete()
      .eq("workspace_id", workspace_id)
      .filter("metadata->>source", "eq", "auto-generated")

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
      // Delete old chunks for this source
      await supabaseAdmin.from("kb_chunks").delete().eq("source_id", sourceId)
    } else {
      const { data: newSource } = await supabaseAdmin
        .from("kb_sources")
        .insert({
          workspace_id,
          label: PROFILE_SOURCE_LABEL,
          source_type: "profile",
          status: "processing",
        })
        .select()
        .single()
      if (newSource) sourceId = newSource.id
    }

    if (!sourceId) {
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 })
    }

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

    // Trigger embed-text batch embedding chain via edge function
    supabaseAdmin.functions.invoke("embed-text", {
      body: { source_id: sourceId, workspace_id, embed_batch: true }
    }).catch((err) => {
      console.error("[REGENERATE] embed-text trigger failed:", err)
      // Mark source as failed if embedding can't start
      supabaseAdmin.from("kb_sources").update({
        status: "failed",
        error_message: "Embedding trigger failed"
      }).eq("id", sourceId).then(() => {}, () => {})
    })

    // Also update the business profile action to trigger regeneration
    // (handled by updateBusinessProfile server action)

    return NextResponse.json({
      success: true,
      chunks_created: rows.length,
      source_id: sourceId,
      tags: sections.map(s => s.tag),
    })
  } catch (err: any) {
    console.error("[REGENERATE] Error:", err)
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}
