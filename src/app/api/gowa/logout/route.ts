import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || ""
const GOWA_API_KEY = process.env.GOWA_API_KEY || ""
const GOWA_AUTH = GOWA_API_KEY ? Buffer.from(GOWA_API_KEY).toString("base64") : ""

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const workspaceId = user.app_metadata.workspace_id
    if (!workspaceId) return new NextResponse("No workspace", { status: 400 })

    // Get DB session for this workspace
    const { data: dbSession } = await (supabase
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle() as any)

    // Logout and delete ONLY this workspace's device from GoWA
    const deviceName = `FlowCore_${workspaceId}`
    try {
      const resp = await fetch(`${GOWA_BASE_URL}/devices`, {
        headers: { "Authorization": `Basic ${GOWA_AUTH}` },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.ok) {
        const data = await resp.json()
        const devices = data.results || []

        // Find our device by name or stored session ID
        const ourDevice = devices.find((d: any) =>
          d.name === deviceName || d.id === dbSession?.gowa_session_id
        )

        if (ourDevice) {
          await fetch(`${GOWA_BASE_URL}/devices/${ourDevice.id}/logout`, {
            method: "POST",
            headers: { "Authorization": `Basic ${GOWA_AUTH}` },
          }).catch(() => {})
          await fetch(`${GOWA_BASE_URL}/devices/${ourDevice.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Basic ${GOWA_AUTH}` },
          }).catch(() => {})
        }
      }
    } catch (e) {
      console.error("[LOGOUT_GOWA_ERROR]", e)
    }

    // Clear gowa_sessions from DB for this workspace
    await (supabase.from("gowa_sessions") as any)
      .delete()
      .eq("workspace_id", workspaceId)

    return NextResponse.json({ status: 'ok', message: 'Session disconnected' })

  } catch (error: any) {
    console.error("[API_LOGOUT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
