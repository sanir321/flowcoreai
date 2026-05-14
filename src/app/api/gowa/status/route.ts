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

    // Find GoWA device by name to match workspace
    let gowaConnected: boolean | "qr_pending" = false
    let gowaJid = ""
    let gowaDisplay = ""
    let gowaDeviceId = ""
    const deviceName = `FlowCore_${workspaceId}`
    let matchedDevice: any = null
    try {
      const resp = await fetch(`${GOWA_BASE_URL}/devices`, {
        headers: { "Authorization": `Basic ${GOWA_AUTH}` },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.ok) {
        const data = await resp.json()
        matchedDevice = (data.results || []).find((d: any) => d.name === deviceName)
        if (matchedDevice?.state === "logged_in" && matchedDevice?.jid) {
          gowaConnected = true
          gowaJid = matchedDevice.jid
          gowaDisplay = matchedDevice.display_name || ""
          gowaDeviceId = matchedDevice.id || ""
        } else if (matchedDevice?.state === "connected") {
          gowaConnected = "qr_pending"
        }
      }
    } catch {}

    // Update DB if device is connected on GoWA but not yet in DB
    if (gowaConnected === true && gowaJid && session?.status !== "connected") {
      await (supabase
        .from("gowa_sessions")
        .update({
          status: "connected",
          phone_jid: gowaJid,
          display_name: gowaDisplay,
          gowa_session_id: gowaDeviceId || session?.gowa_session_id,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceId) as any)
      return NextResponse.json({
        status: "connected",
        phone: gowaJid,
        name: gowaDisplay,
        message: null,
      })
    }

    if (!session && !gowaConnected) {
      return NextResponse.json({ status: "disconnected" })
    }

    const status = session?.status || (gowaConnected === true ? "connected" : "disconnected")
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
