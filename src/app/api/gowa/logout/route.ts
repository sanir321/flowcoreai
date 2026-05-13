import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || ""
const GOWA_API_KEY = process.env.GOWA_API_KEY || ""
const GOWA_AUTH = GOWA_API_KEY ? Buffer.from(GOWA_API_KEY).toString("base64") : ""

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const workspaceId = user.app_metadata.workspace_id
    if (!workspaceId) return new NextResponse("No workspace", { status: 400 })

    // Logout AND delete ALL devices from GoWA
    try {
      const resp = await fetch(`${GOWA_BASE_URL}/devices`, {
        headers: { "Authorization": `Basic ${GOWA_AUTH}` },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.ok) {
        const data = await resp.json()
        const devices = data.results || []
        for (const d of devices) {
          await fetch(`${GOWA_BASE_URL}/devices/${d.id}/logout`, {
            method: "POST",
            headers: { "Authorization": `Basic ${GOWA_AUTH}` },
          }).catch(() => {})
          await fetch(`${GOWA_BASE_URL}/devices/${d.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Basic ${GOWA_AUTH}` },
          }).catch(() => {})
        }
      }
    } catch (e) {
      console.error("[LOGOUT_GOWA_ERROR]", e)
    }

    // Clear all gowa_sessions from DB
    await (supabase.from("gowa_sessions") as any)
        .delete()
        .eq("workspace_id", workspaceId)

    return NextResponse.json({ status: 'ok', message: 'Session disconnected' })

  } catch (error: any) {
    console.error("[API_LOGOUT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
