import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

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
    if (!workspaceId) return NextResponse.json({ error: "No workspace found" }, { status: 404 })

    const [workspaceRes, contactsRes, sessionsRes, messagesRes, agentsRes] = await Promise.all([
      supabase.from("workspaces").select("*").eq("id", workspaceId).single(),
      supabase.from("contacts").select("*").eq("workspace_id", workspaceId).is("deleted_at", null),
      supabase.from("conversation_sessions").select("*").eq("workspace_id", workspaceId).is("deleted_at", null),
      supabase.from("messages").select("*").eq("workspace_id", workspaceId).is("deleted_at", null),
      supabase.from("workspace_agents").select("*").eq("workspace_id", workspaceId).is("deleted_at", null),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email, created_at: user.created_at },
      workspace: workspaceRes.data,
      contacts: contactsRes.data || [],
      sessions: sessionsRes.data || [],
      messages: messagesRes.data || [],
      agents: agentsRes.data || [],
    }

    return NextResponse.json({ success: true, data: exportData })
  } catch (err: any) {
    console.error("[DATA_EXPORT] Error:", err.message)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
