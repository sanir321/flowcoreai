import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || ""
const GOWA_API_KEY = process.env.GOWA_API_KEY || ""
const GOWA_AUTH = GOWA_API_KEY ? Buffer.from(GOWA_API_KEY).toString("base64") : ""

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .maybeSingle()

    if (!workspace) return new NextResponse("No workspace found for user", { status: 404 })
    const workspaceId = workspace.id

    // Check DB session
    const { data: session } = await (supabase
        .from("gowa_sessions")
        .select("status, phone_jid, display_name, error_message, gowa_session_id")
        .eq("workspace_id", workspaceId)
        .maybeSingle() as any)

    // Cross-check with GoWA for any logged-in device
    let gowaConnected: boolean | "qr_pending" = false
    let gowaJid = ""
    let gowaDisplay = ""
    let gowaDeviceId = ""
    try {
      const resp = await fetch(`${GOWA_BASE_URL}/devices`, {
        headers: { "Authorization": `Basic ${GOWA_AUTH}` },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.ok) {
        const data = await resp.json()
        const devices = data.results || []
        for (const d of devices) {
          if (d.state === "logged_in" && d.jid) {
            gowaConnected = true
            gowaJid = d.jid
            gowaDisplay = d.display_name || ""
            gowaDeviceId = d.id || ""
          }
          if (d.state === "connected" && !gowaConnected) {
            gowaConnected = "qr_pending"
          }
        }
      }
    } catch {
      // GoWA unreachable — fall back to DB
    }

    // Only report GoWA device as connected if DB session matches it
    const deviceMatches = session && gowaDeviceId && session.gowa_session_id === gowaDeviceId
    const effectivelyConnected = deviceMatches && gowaConnected === true

    if (!session && !gowaConnected) {
      return NextResponse.json({ status: "disconnected" })
    }

    const status = effectivelyConnected ? "connected" : session?.status || "disconnected"
    return NextResponse.json({
      status,
      phone: session?.phone_jid || null,
      name: session?.display_name || null,
      message: session?.error_message || null,
    })

  } catch (error: any) {
    console.error("[API_STATUS_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
