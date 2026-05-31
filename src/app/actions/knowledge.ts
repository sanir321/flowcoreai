"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"
import { z } from "zod"
import { logAudit } from "@/lib/audit"

// Admin client for triggering background tasks
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        supabaseAdmin.functions.invoke("ingest-url", {
            body: { workspace_id, source_id: data.id, url }
        }).catch(e => console.error("[KB_ACTION] URL Ingestion trigger failed:", e))
    } else if (storage_path) {
        supabaseAdmin.functions.invoke("ingest-document", {
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
    return { data: null, error: err.message || "Failed to add URL source" }
  }
}

export async function deleteSource(id: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const res = z.string().uuid().safeParse(id)
    if (!res.success) return { data: null, error: "Invalid source ID" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Fetch workspace_id for logging and verification
    const { data: source } = await supabase.from("kb_sources").select("workspace_id").eq("id", res.data).maybeSingle()
    if (!source) return { data: null, error: "Source not found" }

    // Delete chunks first, then soft-delete the source
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
    return { data: null, error: err.message || "Failed to delete knowledge source" }
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
    return { data: null, error: err.message || "Failed to create document source" }
  }
}

export async function pasteKbText(input: { workspace_id: string; content: string; tag?: string }): Promise<ActionResponse<{ id: string }>> {
  try {
    const { workspace_id, content, tag } = input
    if (!content.trim()) return { data: null, error: "Content is required" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { data: source, error: sourceError } = await (supabase
      .from("kb_sources") as any)
      .insert({
        workspace_id,
        label: tag || "Pasted text",
        source_type: "txt",
        status: "active",
        chunk_count: 0,
      })
      .select()
      .single()

    if (sourceError) throw sourceError

    const chunks = splitIntoChunks(content, 1000)
    const zeroedEmbedding = new Array(384).fill(0)

    const chunkRows = chunks.map((c, i) => ({
      workspace_id,
      source_id: source.id,
      content: c,
      embedding: zeroedEmbedding,
      chunk_index: i,
      token_count: Math.ceil(c.length / 4),
    }))

    const { error: insertError } = await supabase
      .from("kb_chunks")
      .insert(chunkRows as any)

    if (insertError) throw insertError

    await (supabase
      .from("kb_sources") as any)
      .update({ chunk_count: chunks.length })
      .eq("id", source.id)

    await logAudit({
      workspace_id,
      action: 'add_kb_source',
      entity_type: 'kb_source',
      entity_id: source.id,
      payload: { method: 'paste', label: tag, chars: content.length }
    })

    revalidatePath("/knowledge")

    // Fire-and-forget: extract business profile
    try {
      supabaseAdmin.functions.invoke("extract-business-profile", {
        body: { workspace_id, source_id: source.id }
      }).catch(() => {})
    } catch {}

    return { data: { id: source.id }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: err.message || "Failed to save pasted text" }
  }
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
    return { data: null, error: err.message || "Failed to upload knowledge source" }
  }
}
