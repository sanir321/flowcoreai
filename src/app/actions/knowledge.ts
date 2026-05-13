"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"
import { z } from "zod"

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
    return { data: { id: data.id }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: err.message || "Failed to add URL source" }
  }
}

export async function deleteSource(id: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("kb_sources")
      .delete()
      .eq("id", id)

    if (error) throw error

    revalidatePath("/knowledge")
    return { data: { success: true }, error: null }
  } catch (err: any) {
    console.error(err)
    return { data: null, error: "Failed to delete knowledge source" }
  }
}

export async function createDocumentSource(input: {
  workspace_id: string;
  label: string;
  storage_path: string;
  source_type: string;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase
      .from("kb_sources") as any)
      .insert({
        workspace_id: input.workspace_id,
        label: input.label,
        storage_path: input.storage_path,
        source_type: input.source_type,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    // Trigger document ingestion
    try {
        await supabase.functions.invoke("ingest-document", {
            body: { 
                workspace_id: input.workspace_id, 
                source_id: data.id, 
                storage_path: input.storage_path 
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

export async function uploadDocumentSource(input: {
  workspace_id: string;
  label: string;
  file_name: string;
  source_type: string;
  storage_path: string;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase
      .from("kb_sources") as any)
      .insert({
        workspace_id: input.workspace_id,
        label: input.label,
        source_type: input.source_type,
        storage_path: input.storage_path,
        status: "pending"
      })
      .select()
      .single()

    if (error) throw error

    // Trigger document ingestion
    try {
        await supabase.functions.invoke("ingest-document", {
            body: { 
                workspace_id: input.workspace_id, 
                source_id: data.id, 
                storage_path: input.storage_path 
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
