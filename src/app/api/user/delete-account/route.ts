import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = user.app_metadata?.workspace_id

    if (workspaceId) {
      // Get GoWA device IDs before deleting rows
      const { data: gowaDevices } = await supabase
        .from("gowa_sessions").select("gowa_session_id")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)

      const deletedAt = new Date().toISOString()

      // Soft-delete all workspace data
      await Promise.all([
        supabase.from("contacts").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("conversation_sessions").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("messages").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("workspace_agents").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("kb_sources").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("kb_chunks").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("gowa_sessions").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("google_oauth_tokens").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("widget_config").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("appointments").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("escalation_logs").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("billing_transactions").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("agent_traces" as any).update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("workspace_notifications").update({ deleted_at: deletedAt } as any).eq("workspace_id", workspaceId),
        supabase.from("workspaces").update({ deleted_at: deletedAt } as any).eq("id", workspaceId),
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
