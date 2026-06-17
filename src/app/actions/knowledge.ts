"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"
import { z } from "zod"
import { logAudit } from "@/lib/audit"

// Lazy-initialized admin client for triggering background tasks
let _supabaseAdmin: ReturnType<typeof createSupabaseClient> | null = null
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

const ScrapeUrlSchema = z.object({
  workspace_id: z.string().uuid(),
  url: z.string().url().optional(),
  label: z.string(),
  source_type: z.enum(['url', 'pdf', 'docx', 'txt']),
  storage_path: z.string().optional()
}).refine(data => data.source_type !== 'url' || data.url, {
  message: "URL is required when source type is 'url'"
})

export async function addUrlSource(input: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const result = ScrapeUrlSchema.safeParse(input)
    if (!result.success) {
        console.error("[KB_ACTION] Validation failed:", result.error)
        return { data: null, error: "Invalid input" }
    }

    const { workspace_id, url, label, source_type, storage_path } = result.data
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: null, error: "Unauthorized" }

    const userWorkspaceId = user.app_metadata?.workspace_id
    if (!userWorkspaceId) return { data: null, error: "No workspace" }
    if (workspace_id !== userWorkspaceId) return { data: null, error: "Unauthorized" }

    const { data, error } = await (supabase
      .from("kb_sources") as any)
      .insert({
        workspace_id,
        source_type,
        label,
        url,
        storage_path,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    console.log(`[KB_ACTION] Source created: ${data.id}. Triggering ingestion for type: ${source_type}...`)

    // Trigger the correct ingestion function based on type
    if (source_type === 'url' && url) {
        getSupabaseAdmin().functions.invoke("ingest-url", {
            body: { workspace_id, source_id: data.id, url }
        }).catch(e => console.error("[KB_ACTION] URL Ingestion trigger failed:", e))
    } else if (storage_path) {
        getSupabaseAdmin().functions.invoke("ingest-document", {
            body: { workspace_id, source_id: data.id, storage_path }
        }).catch(e => console.error("[KB_ACTION] Doc Ingestion trigger failed:", e))
    }

    revalidatePath("/knowledge")

    await logAudit({
      workspace_id,
      action: 'add_kb_source',
      entity_type: 'kb_source',
      entity_id: data.id,
      payload: { url, source_type, label }
    })

    return { data: { id: data.id }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: "Failed to add URL source" }
  }
}

export async function deleteSource(id: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const res = z.string().uuid().safeParse(id)
    if (!res.success) return { data: null, error: "Invalid source ID" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { data: source } = await (supabase.from("kb_sources") as any).select("workspace_id, bp_extracted_fields").eq("id", res.data).maybeSingle()
    if (!source) return { data: null, error: "Source not found" }

    // Verify workspace ownership
    const userWsId = user.app_metadata?.workspace_id
    if (!userWsId || source.workspace_id !== userWsId) {
      return { data: null, error: "Unauthorized" }
    }

    const { error: chunkError } = await supabase
      .from("kb_chunks")
      .delete()
      .eq("source_id", res.data)

    if (chunkError) throw chunkError

    const { error } = await supabase
      .from("kb_sources")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", res.data)

    if (error) throw error

    const extractedFields = ((source as any).bp_extracted_fields as string[]) || []
    if (extractedFields.length > 0) {
      const { data: otherSources } = await getSupabaseAdmin()
        .from("kb_sources")
        .select("bp_extracted_fields")
        .eq("workspace_id", source.workspace_id)
        .is("deleted_at", null)
        .neq("id", res.data)

      const fieldsStillProvided = new Set<string>()
      for (const s of (otherSources as any) || []) {
        const fields = (s.bp_extracted_fields as string[]) || []
        for (const f of fields) fieldsStillProvided.add(f)
      }

      const fieldsToClear = extractedFields.filter(f => !fieldsStillProvided.has(f))

      if (fieldsToClear.length > 0) {
        const { data: workspace } = await getSupabaseAdmin()
          .from("workspaces")
          .select("business_profile")
          .eq("id", source.workspace_id)
          .single()

        if ((workspace as any)?.business_profile) {
          const bp = { ...((workspace as any).business_profile as Record<string, unknown>) }
          for (const field of fieldsToClear) {
            delete bp[field]
          }
          await (getSupabaseAdmin() as any)
            .from("workspaces")
            .update({ business_profile: bp, updated_at: new Date().toISOString() })
            .eq("id", source.workspace_id)
        }
      }
    }

    await logAudit({
      workspace_id: source.workspace_id,
      action: 'delete_kb_source',
      entity_type: 'kb_source',
      entity_id: res.data
    })

    revalidatePath("/knowledge")

    return { data: { success: true }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: "Failed to delete knowledge source" }
  }
}

export async function createDocumentSource(input: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const res = z.object({
      workspace_id: z.string().uuid(),
      label: z.string().min(1),
      storage_path: z.string().min(1),
      source_type: z.string().min(1),
    }).safeParse(input)

    if (!res.success) return { data: null, error: "Invalid document source data" }
    const { workspace_id, label, storage_path, source_type } = res.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check
    if (user.app_metadata.workspace_id !== workspace_id) {
      return { data: null, error: "Forbidden: Workspace mismatch" }
    }

    const { data, error } = await (supabase
      .from("kb_sources") as any)
      .insert({
        workspace_id,
        label,
        storage_path,
        source_type,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    // Trigger document ingestion
    try {
        await supabase.functions.invoke("ingest-document", {
            body: { 
                workspace_id, 
                source_id: data.id, 
                storage_path: storage_path 
            }
        })
    } catch (e) {
        console.error("[INGEST_DOC_TRIGGER_ERROR]", e)
    }

    revalidatePath("/knowledge")
    return { data: { id: data.id }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: "Failed to create document source" }
  }
}

export async function pasteKbText(input: { workspace_id: string; content: string; tag?: string }): Promise<ActionResponse<{ id: string }>> {
  try {
    const { workspace_id, content, tag } = input
    if (!content.trim()) return { data: null, error: "Content is required" }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { data: null, error: "Unauthorized" }

    const userWorkspaceId = user.app_metadata?.workspace_id
    if (!userWorkspaceId) return { data: null, error: "No workspace" }
    if (workspace_id !== userWorkspaceId) return { data: null, error: "Unauthorized" }

    const { data: source, error: sourceError } = await (supabase
      .from("kb_sources") as any)
      .insert({
        workspace_id,
        label: tag || "Pasted text",
        source_type: "txt",
        status: "pending",
        chunk_count: 0,
      })
      .select()
      .single()

    if (sourceError) throw sourceError

    await logAudit({
      workspace_id,
      action: 'add_kb_source',
      entity_type: 'kb_source',
      entity_id: source.id,
      payload: { method: 'paste', label: tag, chars: content.length }
    })

    revalidatePath("/knowledge")

    // Fire-and-forget: generate real embeddings + extract business profile
    try {
      getSupabaseAdmin().functions.invoke("embed-text", {
        body: { workspace_id, source_id: source.id, text_content: content, tag: tag || null }
      }).catch(e => console.error("[KB_ACTION] Embed text failed:", e))
    } catch {}

    try {
      getSupabaseAdmin().functions.invoke("extract-business-profile", {
        body: { workspace_id, source_id: source.id }
      }).catch(() => {})
    } catch {}

    return { data: { id: source.id }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: "Failed to save pasted text" }
  }
}


export async function uploadDocumentSource(input: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const res = z.object({
      workspace_id: z.string().uuid(),
      label: z.string().min(1),
      file_name: z.string().min(1),
      source_type: z.string().min(1),
      storage_path: z.string().min(1),
    }).safeParse(input)

    if (!res.success) return { data: null, error: "Invalid upload data" }
    const { workspace_id, label, source_type, storage_path } = res.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check
    if (user.app_metadata.workspace_id !== workspace_id) {
      return { data: null, error: "Forbidden: Workspace mismatch" }
    }

    const { data, error } = await (supabase
      .from("kb_sources") as any)
      .insert({
        workspace_id,
        label,
        source_type,
        storage_path,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    // Trigger document ingestion
    try {
        await supabase.functions.invoke("ingest-document", {
            body: { 
                workspace_id, 
                source_id: data.id, 
                storage_path: storage_path 
            }
        })
    } catch (e) {
        console.error("[INGEST_DOC_TRIGGER_ERROR]", e)
    }

    revalidatePath("/knowledge")
    return { data: { id: data.id }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: "Failed to upload knowledge source" }
  }
}
