import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || ""
const GOWA_API_KEY = process.env.GOWA_API_KEY || ""
const GOWA_AUTH = GOWA_API_KEY ? Buffer.from(GOWA_API_KEY).toString("base64") : ""

async function deleteGoWADevice(deviceId: string) {
  try {
    await fetch(`${GOWA_BASE_URL}/devices/${deviceId}/logout`, {
      method: "POST", headers: { "Authorization": `Basic ${GOWA_AUTH}` },
    }).catch(() => {})
    await fetch(`${GOWA_BASE_URL}/devices/${deviceId}`, {
      method: "DELETE", headers: { "Authorization": `Basic ${GOWA_AUTH}` },
    }).catch(() => {})
  } catch {}
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = user.app_metadata?.workspace_id

    if (workspaceId) {
      // Get GoWA device IDs before deleting rows
      const { data: gowaDevices } = await supabase
        .from("gowa_sessions").select("gowa_session_id")
        .eq("workspace_id", workspaceId)

      // Delete all workspace data
      await Promise.all([
        supabase.from("contacts").delete().eq("workspace_id", workspaceId),
        supabase.from("conversation_sessions").delete().eq("workspace_id", workspaceId),
        supabase.from("messages").delete().eq("workspace_id", workspaceId),
        supabase.from("workspace_agents").delete().eq("workspace_id", workspaceId),
        supabase.from("kb_sources").delete().eq("workspace_id", workspaceId),
        supabase.from("kb_chunks").delete().eq("workspace_id", workspaceId),
        supabase.from("gowa_sessions").delete().eq("workspace_id", workspaceId),
        supabase.from("google_oauth_tokens").delete().eq("workspace_id", workspaceId),
        supabase.from("widget_config").delete().eq("workspace_id", workspaceId),
        supabase.from("appointments").delete().eq("workspace_id", workspaceId),
        supabase.from("escalation_logs").delete().eq("workspace_id", workspaceId),
        supabase.from("billing_transactions").delete().eq("workspace_id", workspaceId),
        supabase.from("agent_traces").delete().eq("workspace_id", workspaceId),
        supabase.from("workspace_notifications").delete().eq("workspace_id", workspaceId),
        supabase.from("workspaces").delete().eq("id", workspaceId),
      ])

      // Logout + delete GoWA device from Railway
      for (const d of gowaDevices || []) {
        await deleteGoWADevice(d.gowa_session_id)
      }
    }

    // Delete auth user (service_role)
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[DELETE_ACCOUNT] Error:", err.message)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
