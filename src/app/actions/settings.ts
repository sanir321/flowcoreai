"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { UpdateNotificationsSchema, UpdateWidgetConfigSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"
import { z } from "zod"
import { verifyWorkspaceOwnership, getUserWorkspaceId } from "@/lib/workspace-auth"

// Lazy-initialized admin client
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

export async function updateNotifications(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UpdateNotificationsSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { workspace_id, ...config } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, workspace_id)
    if (!auth.authorized) return { data: null, error: auth.error }

    const { error } = await supabase
      .from("workspace_notifications")
      .update(config)
      .eq("workspace_id", workspace_id)

    if (error) throw error

    revalidatePath("/settings")
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to update notifications" }
  }
}

function sanitizeDomain(domain: string): string {
  let d = domain.trim();
  // Remove protocol
  d = d.replace(/^https?:\/\//i, '');
  // Remove path (everything after first /)
  d = d.replace(/\/.*$/, '');
  // Remove port
  d = d.replace(/:.*$/, '');
  // Lowercase
  d = d.toLowerCase();
  // Remove trailing dot
  d = d.replace(/\.$/, '');
  return d;
}

export async function updateWidgetConfig(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UpdateWidgetConfigSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { workspace_id, allowed_domains, ...config } = result.data

    // Sanitize each allowed domain (strip protocol, path, port, etc.)
    const sanitized = allowed_domains?.map(sanitizeDomain).filter(Boolean) || []

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, workspace_id)
    if (!auth.authorized) return { data: null, error: auth.error }

    const { error } = await supabase
      .from("widget_config")
      .upsert({ workspace_id, allowed_domains: sanitized, ...config, updated_at: new Date().toISOString() }, { onConflict: "workspace_id" })

    if (error) throw error

    revalidatePath("/settings")
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to update widget config" }
  }
}

export async function getGoogleAuthUrl(workspace_id: string): Promise<ActionResponse<{ url: string; nonce: string }>> {
  try {
    const result = z.string().uuid().safeParse(workspace_id)
    if (!result.success) return { data: null, error: "Invalid workspace ID" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, result.data)
    if (!auth.authorized) return { data: null, error: auth.error }

    const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
    const scope = encodeURIComponent(
      "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/spreadsheets"
    );

    const { createHmac, randomBytes } = await import('node:crypto');
    if (!process.env.INTERNAL_CRON_SECRET) {
      return { data: null, error: "Server configuration error: missing secret" };
    }

    const nonce = randomBytes(16).toString('hex');
    const hmac = createHmac('sha256', process.env.INTERNAL_CRON_SECRET);
    hmac.update(result.data + ':' + nonce);
    const stateSig = hmac.digest('hex');
    const state = `${result.data}.${nonce}.${stateSig}`;

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

    return { data: { url, nonce }, error: null };
  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to generate auth URL" }
  }
}

export interface GoogleConfigInput {
  workspace_id: string
  calendar_id?: string
  sheet_id?: string
  sheet_range?: string
}

export async function updateGoogleConfig(input: unknown): Promise<ActionResponse<{ success: true }>> {
    try {
      const result = z.object({
        workspace_id: z.string().uuid(),
        calendar_id: z.string().optional(),
        sheet_id: z.string().optional(),
        sheet_range: z.string().optional(),
      }).safeParse(input)

      if (!result.success) return { data: null, error: "Invalid input" }
      const { workspace_id, calendar_id, sheet_id, sheet_range } = result.data
  
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: "Unauthorized" }

      // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
      const auth = await verifyWorkspaceOwnership(supabase, user.id, workspace_id)
      if (!auth.authorized) return { data: null, error: auth.error }
  
      const { error } = await supabase
        .from("google_oauth_tokens")
        .update({ 
          calendar_id: calendar_id || 'primary', 
          sheet_id, 
          sheet_range,
          updated_at: new Date().toISOString() 
        })
        .eq("workspace_id", workspace_id)
  
      if (error) throw error
  
      revalidatePath("/settings/integrations")
      return { data: { success: true }, error: null }
  
    } catch (err) {
      console.error(err)
      return { data: null, error: "Failed to update Google config" }
    }
  }

export async function disconnectGoogleIntegration(workspace_id: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const res = z.string().uuid().safeParse(workspace_id)
    if (!res.success) return { data: null, error: "Invalid workspace ID" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, res.data)
    if (!auth.authorized) return { data: null, error: auth.error }

    const { error } = await supabase
      .from("google_oauth_tokens")
      .delete()
      .eq("workspace_id", res.data)

    if (error) throw error

    revalidatePath("/settings/integrations")
    return { data: { success: true }, error: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err)
    return { data: null, error: "Failed to disconnect" }
  }
}

export async function exportToSheets(workspace_id: string): Promise<ActionResponse<{ exported: number }>> {
    try {
      const res = z.string().uuid().safeParse(workspace_id)
      if (!res.success) return { data: null, error: "Invalid workspace ID" }

      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: "Unauthorized" }

      // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
      const auth = await verifyWorkspaceOwnership(supabase, user.id, res.data)
      if (!auth.authorized) return { data: null, error: auth.error }

      const { data, error } = await getSupabaseAdmin().functions.invoke("crm-export", {
        body: { workspace_id: res.data }
      })

      if (error) throw new Error(error.message || "Export failed")
      return { data: { exported: data.exported || 0 }, error: null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err)
      return { data: null, error: "Failed to export to Sheets" }
    }
  }



