"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

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

export async function createWorkspace(input: WorkspaceCreateInput): Promise<ActionResponse<{ workspace_id: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error, data } = await supabase
      .from("workspaces")
      .insert({
        name: input.name,
        business_type: input.business_type,
        website_url: input.website_url,
        employee_count: input.employee_count,
        owner_id: user.id,
        status: 'active'
      })
      .select("id")
      .single()

    if (error) throw error

    return { data: { workspace_id: data.id }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to create workspace" }
  }
}

export async function updateWorkspace(input: {
  id: string;
  name?: string;
  business_type?: string;
  timezone?: string;
  owner_personal_phone?: string;
}): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("workspaces")
      .update({
        name: input.name,
        business_type: input.business_type,
        timezone: input.timezone,
        owner_personal_phone: input.owner_personal_phone,
        updated_at: new Date().toISOString()
      })
      .eq("id", input.id)
      .eq("owner_id", user.id)

    if (error) throw error

    revalidatePath("/settings")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to update workspace" }
  }
}

export async function updateWelcomeTemplate(workspace_id: string, template: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("workspaces")
      .update({ welcome_template: template })
      .eq("id", workspace_id)
      .eq("owner_id", user.id)

    if (error) throw error

    revalidatePath("/settings")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to update welcome template" }
  }
}

export async function checkUserExists(email: string): Promise<ActionResponse<{ exists: boolean }>> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.auth.admin.listUsers()
    const exists = data?.users.some(u => u.email === email) ?? false
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

    const { error } = await supabase.from("workspaces").delete().eq("id", workspaceId).eq("owner_id", user.id)
    if (error) throw error

    const admin = createAdminClient()
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
