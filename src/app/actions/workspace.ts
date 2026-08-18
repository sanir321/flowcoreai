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
import { CreateWorkspaceSchema, UpdateWorkspaceConfigSchema } from "@/lib/schemas/workspace"
import { headers } from "next/headers"
import { rateLimit } from "@/lib/rate-limit"

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
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    let ip = "127.0.0.1";
    if (forwarded) {
      const parts = forwarded.split(",").map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) ip = parts[parts.length - 1]!;
    } else {
      ip = h.get("x-real-ip")?.trim() || "127.0.0.1";
    }

    const { success: isAllowed } = await rateLimit(`create_ws_${ip}`);
    if (!isAllowed) {
      return { data: null, error: "Too many requests. Please try again later." };
    }

    const result = CreateWorkspaceSchema.safeParse(input)

    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid workspace data"
      return { data: null, error: firstError }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Pre-check: prevent duplicate workspaces for the same user
    const { data: existingWs } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .limit(1)
    if (existingWs && existingWs.length > 0 && existingWs[0]) {
      return { data: { workspace_id: existingWs[0].id }, error: null }
    }

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

    // M6: the partial unique index (idx_workspaces_active_owner) makes the
    // create race-safe — if two requests slip past the pre-check, the loser
    // hits a unique violation and we return the existing workspace instead.
    if (error) {
      const isUniqueViolation = (error as { code?: string }).code === "23505"
      if (isUniqueViolation) {
        const { data: winnerWs } = await supabase
          .from("workspaces")
          .select("id")
          .eq("owner_id", user.id)
          .is("deleted_at", null)
          .limit(1)
        if (winnerWs && winnerWs.length > 0 && winnerWs[0]) {
          return { data: { workspace_id: winnerWs[0].id }, error: null }
        }
      }
      throw error
    }

    // Atomic provisioning of defaults
    await Promise.all([
      supabase.from("workspace_agents").insert({
        workspace_id: data.id,
        agent_type: "customer_support",
        status: "paused"
      }),
      supabase.from("workspace_notifications").insert({
        workspace_id: data.id
      }),
      supabase.from("widget_config").insert({
        workspace_id: data.id
      })
    ]).catch(e => console.error("[WORKSPACE_DEFAULTS_PROVISION_FAILED]", e));

    // Set workspace_id in app_metadata — now awaited to synchronize state
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(user.id, {
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
          subject: "Welcome to Flowcore!",
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

export async function deleteWorkspace(): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) return { data: null, error: "No workspace found" }

    const errors: string[] = []

    // 1. Cleanup GoWA session (best-effort — external API)
    const { data: gowaSessions } = await supabase
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .limit(1)

    const gowaSession = gowaSessions?.[0]

    if (gowaSession?.gowa_session_id) {
      const logoutErr = await logoutSession(gowaSession.gowa_session_id).catch(e => e)
      if (logoutErr) errors.push(`gowa_logout: ${logoutErr}`)
      const deviceErr = await deleteDevice(gowaSession.gowa_session_id).catch(e => e)
      if (deviceErr) errors.push(`gowa_device: ${deviceErr}`)
    }

    // 2. Soft-delete gowa_sessions
    const { error: gowaDelErr } = await supabase
      .from("gowa_sessions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
    if (gowaDelErr) errors.push(`gowa_sessions: ${gowaDelErr.message}`)

    // 3. Soft-delete workspace (critical — must not silently fail)
    const admin = createAdminClient()
    const { error: wsErr } = await admin
      .from("workspaces")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", workspaceId)
      .eq("owner_id", user.id)
    if (wsErr) errors.push(`workspaces: ${wsErr.message}`)

    // 4. Clear app_metadata
    const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {}
    })
    if (metaErr) errors.push(`app_metadata: ${metaErr.message}`)

    // If the workspace itself failed to delete, abort — don't report partial success
    if (wsErr) throw new Error(`Workspace delete failed: ${wsErr.message}`)

    if (errors.length) {
      console.error("[WORKSPACE_DELETE_PARTIAL]", errors)
    }

    revalidatePath("/", "layout")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to delete workspace" }
  }
}
