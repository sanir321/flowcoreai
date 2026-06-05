"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logAudit } from "@/lib/audit"

const businessProfileSchema = z.object({
  workspace_id: z.string().uuid(),
  contact: z.object({
    phone: z.string().optional().default(""),
    email: z.string().optional().default(""),
    address: z.string().optional().default(""),
    google_maps_link: z.string().optional().default(""),
  }).optional(),
  social: z.object({
    instagram: z.string().optional().default(""),
    facebook: z.string().optional().default(""),
    twitter: z.string().optional().default(""),
    linkedin: z.string().optional().default(""),
    youtube: z.string().optional().default(""),
    whatsapp: z.string().optional().default(""),
  }).optional(),
  hours: z.object({
    daily: z.record(z.string(), z.object({
      open: z.string().optional().default(""),
      close: z.string().optional().default(""),
      closed: z.boolean().optional().default(false),
    })).optional().default({}),
  }).optional(),
  amenities: z.array(z.string()).optional().default([]),
  policies: z.record(z.string(), z.string()).optional().default({}),
  pricing: z.object({
    description: z.string().optional().default(""),
    currency: z.string().optional().default("INR"),
  }).optional(),
  extras: z.record(z.string(), z.any()).optional().default({}),
})

export type BusinessProfile = z.infer<typeof businessProfileSchema>

export async function getBusinessProfile(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Unauthorized" }

  const { data, error } = await (supabase as any)
    .from("workspaces")
    .select("business_profile")
    .eq("id", workspaceId)
    .single()

  if (error) return { data: null, error: error.message }

  return {
    data: (data?.business_profile || {}) as BusinessProfile,
    error: null
  }
}

export async function updateBusinessProfile(input: unknown) {
  try {
    const result = z.object({
      workspace_id: z.string().uuid(),
      profile: businessProfileSchema.omit({ workspace_id: true }),
    }).safeParse(input)

    if (!result.success) {
      console.error("[PROFILE] Validation error:", result.error.format())
      return { data: null, error: "Invalid profile data" }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const workspaceId = result.data.workspace_id

    const { data: existing } = await (supabase as any)
      .from("workspaces")
      .select("business_profile")
      .eq("id", workspaceId)
      .single()

    if (!existing) return { data: null, error: "Workspace not found" }

    const merged = {
      ...(existing.business_profile || {}),
      ...result.data.profile,
    } as Record<string, unknown>

    for (const [key, val] of Object.entries(result.data.profile)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        merged[key] = {
          ...((existing.business_profile as Record<string, unknown>)?.[key] as Record<string, unknown> || {}),
          ...val as Record<string, unknown>,
        }
      }
    }

    const { error } = await (supabase as any)
      .from("workspaces")
      .update({
        business_profile: merged as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId)

    if (error) throw error

    await logAudit({
      workspace_id: workspaceId,
      action: 'update_business_profile',
      entity_type: 'workspace',
      entity_id: workspaceId,
    })

    revalidatePath("/settings/business-profile")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to update business profile" }
  }
}

export interface RequiredInfoItem {
  id: string
  label: string
  description: string | null
  section: string
  field_key: string
  priority: number
  is_required: boolean
  status: "complete" | "empty"
}

export interface RequiredInfoResult {
  items: RequiredInfoItem[]
  progress: number
}

export async function getRequiredInfo(workspaceId: string): Promise<{ data: RequiredInfoResult | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const wsResult = await (supabase as any)
      .from("workspaces")
      .select("name, business_profile")
      .eq("id", workspaceId)
      .single()

    if (wsResult.error) return { data: null, error: wsResult.error.message }

    const businessProfile = (wsResult.data.business_profile || {}) as Record<string, unknown>

    const { data: templates, error } = await (supabase as any)
      .from("required_info_templates")
      .select("*")
      .order("priority", { ascending: true })

    if (error) return { data: null, error: error.message }

    const { data: tags } = await (supabase as any).rpc("get_distinct_kb_tags", {
      p_workspace_id: workspaceId
    })

    const usedTags = new Set<string>(tags || [])

    const items: RequiredInfoItem[] = (templates || []).map((t: any) => {
      let status: "complete" | "empty" = "empty"

      if (t.section === "business_profile") {
        const bp = businessProfile as Record<string, unknown>
        const extras = (bp.extras || {}) as Record<string, unknown>

        let val: unknown = null
        const fkey = t.field_key
        if (fkey.startsWith("extras.")) {
          val = extras[fkey.replace("extras.", "")]
        } else {
          val = bp[fkey]
        }

        if (val != null) {
          if (Array.isArray(val)) {
            status = val.length > 0 ? "complete" : "empty"
          } else if (typeof val === "object") {
            status = Object.values(val as Record<string, unknown>).some(v => v != null && v !== "") ? "complete" : "empty"
          } else if (typeof val === "string") {
            status = val.trim().length > 0 ? "complete" : "empty"
          } else {
            status = "complete"
          }
        }
      } else if (t.section === "knowledge_base") {
        status = usedTags.has(t.field_key) ? "complete" : "empty"
      }

      return {
        id: t.id,
        label: t.label,
        description: t.description,
        section: t.section,
        field_key: t.field_key,
        priority: t.priority,
        is_required: t.is_required,
        status,
      }
    })

    const completed = items.filter(i => i.status === "complete").length
    const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0

    return { data: { items, progress }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to get required info" }
  }
}
