"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { UpdateNotificationsSchema, UpdateWidgetConfigSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function updateNotifications(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UpdateNotificationsSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { workspace_id, ...config } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

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

export async function updateWidgetConfig(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UpdateWidgetConfigSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { workspace_id, ...config } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("widget_config")
      .update(config)
      .eq("workspace_id", workspace_id)

    if (error) throw error

    revalidatePath("/settings")
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to update widget config" }
  }
}

export async function getGoogleAuthUrl(workspace_id: string): Promise<ActionResponse<{ url: string }>> {
  const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  const scope = encodeURIComponent(
    "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/spreadsheets"
  );

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${workspace_id}`;

  return { data: { url }, error: null };
}

export interface GoogleConfigInput {
  workspace_id: string
  calendar_id?: string
  sheet_id?: string
  sheet_range?: string
}

export async function updateGoogleConfig(input: GoogleConfigInput): Promise<ActionResponse<{ success: true }>> {
    try {
      const { workspace_id, calendar_id, sheet_id, sheet_range } = input
  
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: "Unauthorized" }
  
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

export async function exportToSheets(workspace_id: string): Promise<ActionResponse<{ exported: number }>> {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: "Unauthorized" }

      const { data, error } = await supabaseAdmin.functions.invoke("crm-export", {
        body: { workspace_id }
      })

      if (error) throw new Error(error.message || "Export failed")
      return { data: { exported: data.exported || 0 }, error: null }
    } catch (err: any) {
      console.error(err)
      return { data: null, error: err.message || "Failed to export to Sheets" }
    }
  }



