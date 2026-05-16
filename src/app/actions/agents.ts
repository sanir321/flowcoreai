"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { FinalizeOnboardingSchema, SetAgentStatusSchema, AddAgentSchema, UpdateAgentConfigSchema, DeleteAgentSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"

export async function finalizeOnboarding(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = FinalizeOnboardingSchema.safeParse(input)
    if (!result.success) {
      return { data: null, error: "Invalid input" }
    }

    const { workspace_id, agent_types } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const agentsToInsert = agent_types.map(type => ({
      workspace_id,
      agent_type: type,
      status: 'active' as const
    }))

    const { error: agentError } = await supabase.from("workspace_agents").insert(agentsToInsert)

    if (agentError) throw agentError

    // CRITICAL: Update user app_metadata so middleware knows they have a workspace
    const admin = createAdminClient()
    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { workspace_id: workspace_id }
    })

    if (authError) {
      console.error("[AUTH_METADATA_UPDATE_FAILED]", authError)
      // We don't throw here because the DB part succeeded, but it might cause redirection issues until next sign-in
    }

    revalidatePath("/agent-hub")
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to finalize setup" }
  }
}

export async function setAgentStatus(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = SetAgentStatusSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { agent_id, status } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("workspace_agents")
      .update({ status })
      .eq("id", agent_id)

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to update agent status" }
  }
}

export async function addAgent(input: unknown): Promise<ActionResponse<{ agent_id: string }>> {
  try {
    const result = AddAgentSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { workspace_id, agent_type } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { data: agent, error } = await supabase
      .from("workspace_agents")
      .insert({
        workspace_id,
        agent_type,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { agent_id: agent.id }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to add agent" }
  }
}

export async function deleteAgent(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = DeleteAgentSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { agent_id } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("workspace_agents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", agent_id)

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to delete agent" }
  }
}

export async function updateAgentConfig(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UpdateAgentConfigSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { agent_id, config } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Fetch existing config to merge
    const { data: agent } = await supabase.from("workspace_agents").select("config").eq("id", agent_id).single()
    const mergedConfig = { ...(agent?.config as any || {}), ...config }

    const { error } = await supabase
      .from("workspace_agents")
      .update({ config: mergedConfig })
      .eq("id", agent_id)

    if (error) throw error

    revalidatePath(`/agents/${agent_id}`)
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to update configuration" }
  }
}
