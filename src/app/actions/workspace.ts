"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logAudit } from "@/lib/audit"
import { logoutSession, deleteDevice } from "@/lib/gowa"
import { sendEmail } from "@/lib/mail"
import { render } from "@react-email/components"
import { WelcomeEmail } from "@/components/emails/welcome"
import * as React from "react"
import { getUserWorkspaceId } from "@/lib/workspace-auth"
import { CreateWorkspaceSchema } from "@/lib/schemas/workspace"

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
    const result = CreateWorkspaceSchema.safeParse(input)

    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid workspace data"
      return { data: null, error: firstError }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, data } = await (supabase as any)
      .from("workspaces")
      .insert({
        name: result.data.name,
        business_type: result.data.business_type,
        website_url: result.data.website_url,
        owner_personal_phone: result.data.contact_phone || null,
        employee_count: result.data.employee_count,
        owner_id: user.id,
        status: 'active',
        credits_balance: 500
      })
      .select("id")
      .single()

    if (error) throw error

    // Set workspace_id in app_metadata — fire-and-forget because all dashboard pages
    // now have DB fallback (query by owner_id) if the JWT is stale
    const admin = createAdminClient()
    admin.auth.admin.updateUserById(user.id, {
      app_metadata: { workspace_id: data.id }
    }).catch(e => console.error("[WORKSPACE_METADATA_UPDATE_FAILED]", e))

    // Fire website scrape on signup for auto-enrichment
    if (result.data.website_url) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        fetch(`${supabaseUrl}/functions/v1/extract-business-profile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: data.id,
            website_url: result.data.website_url,
          }),
        }).catch(e => console.error("[WORKSPACE_SCRAPE_FAILED]", e))
      }
    }

    // Send welcome email
    if (user.email) {
      try {
        const emailHtml = await render(
          React.createElement(WelcomeEmail, {
            username: result.data.name || user.email?.split("@")[0] || "there",
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000"}/login`,
          })
        )
        await sendEmail({
          to: user.email,
          subject: "Welcome to FlowCore!",
          html: emailHtml,
        })
      } catch (e) {
        console.error("[WORKSPACE_WELCOME_EMAIL_FAILED]", e)
      }
    }

    return { data: { workspace_id: data.id }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to create workspace" }
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
    return { data: null, error: "Failed to update workspace" }
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
    return { data: null, error: "Failed to update welcome template" }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    if (error) throw error
    
    return { data: { exists: users.length > 0 }, error: null }
  } catch (err) {
    console.error(err)
    // Return generic error to prevent information leakage
    return { data: null, error: "Failed to check user" }
  }
}

export async function deleteWorkspace(): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
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
      .update({ deleted_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)

    // Soft-delete workspace
    const admin = createAdminClient()
    const { error } = await admin
      .from("workspaces")
      .update({ deleted_at: new Date().toISOString() })
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
    return { data: null, error: "Failed to delete workspace" }
  }
}
