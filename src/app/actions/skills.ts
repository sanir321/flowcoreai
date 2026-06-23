"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server"
import { CreateSkillSchema, UpdateSkillSchema, DeleteSkillSchema, AssignSkillSchema, UnassignSkillSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"

export async function createSkill(input: unknown): Promise<ActionResponse<{ skill_id: string }>> {
  try {
    const result = CreateSkillSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const workspaceId = user.app_metadata?.workspace_id
    if (!workspaceId) return { data: null, error: "No workspace" }
    if (result.data.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    const { data: skill, error } = await (supabase as any)
      .from("agent_skills")
      .insert({ ...result.data, workspace_id: workspaceId })
      .select("id")
      .single()

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { skill_id: skill.id }, error: null }
  } catch (err) {
    console.error("[createSkill] Error:", err)
    return { data: null, error: "Failed to create skill" }
  }
}

export async function updateSkill(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UpdateSkillSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { skill_id, ...fields } = result.data

    const { data: skill } = await (supabase as any)
      .from("agent_skills")
      .select("workspace_id")
      .eq("id", skill_id)
      .single()

    if (!skill) return { data: null, error: "Skill not found" }

    const workspaceId = user.app_metadata?.workspace_id
    if (!workspaceId || skill.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    const { error } = await (supabase as any)
      .from("agent_skills")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", skill_id)

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error("[updateSkill] Error:", err)
    return { data: null, error: "Failed to update skill" }
  }
}

export async function deleteSkill(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = DeleteSkillSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { data: skill } = await (supabase as any)
      .from("agent_skills")
      .select("workspace_id")
      .eq("id", result.data.skill_id)
      .single()

    if (!skill) return { data: null, error: "Skill not found" }

    const workspaceId = user.app_metadata?.workspace_id
    if (!workspaceId || skill.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    const { error } = await (supabase as any)
      .from("agent_skills")
      .delete()
      .eq("id", result.data.skill_id)

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error("[deleteSkill] Error:", err)
    return { data: null, error: "Failed to delete skill" }
  }
}

export async function assignSkill(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = AssignSkillSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const workspaceId = user.app_metadata?.workspace_id
    if (!workspaceId) return { data: null, error: "No workspace" }

    const { data: agent } = await (supabase as any)
      .from("workspace_agents")
      .select("workspace_id")
      .eq("id", result.data.agent_id)
      .single()

    if (!agent || agent.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    const { error } = await (supabase as any)
      .from("agent_skill_assignments")
      .insert({ agent_id: result.data.agent_id, skill_id: result.data.skill_id })

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error("[assignSkill] Error:", err)
    return { data: null, error: "Failed to assign skill" }
  }
}

export async function unassignSkill(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UnassignSkillSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const workspaceId = user.app_metadata?.workspace_id
    if (!workspaceId) return { data: null, error: "No workspace" }

    const { data: agent } = await (supabase as any)
      .from("workspace_agents")
      .select("workspace_id")
      .eq("id", result.data.agent_id)
      .single()

    if (!agent || agent.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    const { error } = await (supabase as any)
      .from("agent_skill_assignments")
      .delete()
      .eq("agent_id", result.data.agent_id)
      .eq("skill_id", result.data.skill_id)

    if (error) throw error

    revalidatePath("/agent-hub")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error("[unassignSkill] Error:", err)
    return { data: null, error: "Failed to unassign skill" }
  }
}
