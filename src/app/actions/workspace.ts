"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logAudit } from "@/lib/audit"
import { logoutSession, deleteDevice } from "@/lib/gowa"

export interface Workspace {
  id: string
  name: string
  business_type: string | null
  website_url: string | null
  employee_count: string | null
  owner_id: string
  status: 'active' | 'inactive' | 'suspended'
  welcome_template?: string
  timezone: string
  owner_personal_phone: string | null
  credits_balance: number
  created_at: string
  updated_at: string
}

export interface WorkspaceCreateInput {
  name: string
  business_type?: string
  website_url?: string
  employee_count?: string
}

export type ActionResponse<T = unknown> = {
  data: T | null;
  error: string | null;
}

export async function createWorkspace(input: unknown): Promise<ActionResponse<{ workspace_id: string }>> {
  try {
    const result = z.object({
      name: z.string().min(1),
      business_type: z.string().optional(),
      website_url: z.string().url().optional().or(z.literal("")),
      employee_count: z.string().optional(),
    }).safeParse(input)

    if (!result.success) {
      return { data: null, error: "Invalid workspace data" }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error, data } = await supabase
      .from("workspaces")
      .insert({
        name: result.data.name,
        business_type: result.data.business_type,
        website_url: result.data.website_url,
        employee_count: result.data.employee_count,
        owner_id: user.id,
        status: 'active'
      })
      .select("id")
      .single()

    if (error) throw error

    // Set workspace_id in app_metadata immediately so the user can access the workspace
    // even if finalizeOnboarding fails later
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { workspace_id: data.id }
    }).catch(e => console.error("[WORKSPACE_METADATA_UPDATE_FAILED]", e))

    return { data: { workspace_id: data.id }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to create workspace" }
  }
}

export async function updateWorkspace(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = z.object({
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      business_type: z.string().optional(),
      timezone: z.string().optional(),
      owner_personal_phone: z.string().optional(),
      upi_id: z.string().optional(),
    }).safeParse(input)

    if (!result.success) {
      return { data: null, error: "Invalid update data" }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("workspaces")
      .update({
        name: result.data.name,
        business_type: result.data.business_type,
        timezone: result.data.timezone,
        owner_personal_phone: result.data.owner_personal_phone,
        upi_id: result.data.upi_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", result.data.id)
      .eq("owner_id", user.id)

    if (error) throw error

    await logAudit({
      workspace_id: result.data.id,
      action: 'update_workspace',
      entity_type: 'workspace',
      entity_id: result.data.id,
      payload: result.data
    })

    revalidatePath("/settings")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to update workspace" }
  }
}

export async function updateWelcomeTemplate(workspace_id: string, template: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = z.object({
      workspace_id: z.string().uuid(),
      template: z.string()
    }).safeParse({ workspace_id, template })

    if (!result.success) {
      return { data: null, error: "Invalid template data" }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("workspaces")
      .update({ welcome_template: result.data.template })
      .eq("id", result.data.workspace_id)
      .eq("owner_id", user.id)

    if (error) throw error

    await logAudit({
      workspace_id: result.data.workspace_id,
      action: 'update_welcome_template',
      entity_type: 'workspace',
      entity_id: result.data.workspace_id,
      payload: { template_length: result.data.template.length }
    })

    revalidatePath("/settings")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to update welcome template" }
  }
}

export async function checkUserExists(email: string): Promise<ActionResponse<{ exists: boolean }>> {
  try {
    const emailResult = z.string().email().safeParse(email)
    if (!emailResult.success) {
      return { data: null, error: "Invalid email address" }
    }

    const supabase = createAdminClient()
    
    // Efficiently check if user exists without listing all users
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      filters: {
        email: emailResult.data
      },
      perPage: 1
    } as any)

    if (error) throw error
    
    const exists = users.length > 0
    return { data: { exists }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to check user" }
  }
}

export async function deleteWorkspace(): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const workspaceId = user.app_metadata?.workspace_id
    if (!workspaceId) return { data: null, error: "No workspace found" }

    // Cleanup GoWA session before deleting workspace
    const { data: gowaSession } = await supabase
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .maybeSingle()

    if (gowaSession?.gowa_session_id) {
      await logoutSession(gowaSession.gowa_session_id).catch(e =>
        console.error("[WORKSPACE_DELETE_LOGOUT_FAILED]", e)
      )
      await deleteDevice(gowaSession.gowa_session_id).catch(e =>
        console.error("[WORKSPACE_DELETE_DEVICE_FAILED]", e)
      )
    }

    // Soft-delete gowa_sessions
    await supabase
      .from("gowa_sessions")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("workspace_id", workspaceId)

    // Soft-delete workspace
    const admin = createAdminClient()
    const { error } = await admin
      .from("workspaces")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", workspaceId)
      .eq("owner_id", user.id)

    if (error) throw error

    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {}
    })

    revalidatePath("/", "layout")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to delete workspace" }
  }
}
