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

    // Check GoWA devices — try matching by name first, then ID, then fallback to any logged_in device
    let gowaConnected = false
    let gowaJid = ""
    let gowaDisplay = ""
    let gowaDeviceId = ""
    const deviceName = `FlowCore_${workspaceId}`
    try {
      const resp = await fetch(`${GOWA_BASE_URL}/devices`, {
        headers: { "Authorization": `Basic ${GOWA_AUTH}` },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.ok) {
        const data = await resp.json()
        const devices: any[] = data.results || []

        // 1. Match by device name (new flow)
        const named = devices.find(d => d.name === deviceName)
        // 2. Match by stored session ID (if DB has one)
        const byId = session?.gowa_session_id
          ? devices.find(d => d.id === session.gowa_session_id)
          : null
        // 3. Fallback: any logged_in device
        const anyLoggedIn = devices.find(d => d.state === "logged_in" && d.jid)

        const candidate = named || byId || anyLoggedIn
        if (candidate?.state === "logged_in" && candidate?.jid) {
          gowaConnected = true
          gowaJid = candidate.jid
          gowaDisplay = candidate.display_name || ""
          gowaDeviceId = candidate.id || ""
        }
      }
    } catch {}

    // Auto-update DB if device is connected on GoWA but DB is stale
    if (gowaConnected && gowaJid && session?.status !== "connected") {
      await (supabase
        .from("gowa_sessions")
        .upsert({
          workspace_id: workspaceId,
          gowa_session_id: gowaDeviceId,
          phone_jid: gowaJid,
          display_name: gowaDisplay,
          status: "connected",
          updated_at: new Date().toISOString(),
        }) as any)
      return NextResponse.json({
        status: "connected",
        phone: gowaJid,
        name: gowaDisplay,
        message: null,
      })
    }

    const status = session?.status || (gowaConnected ? "connected" : "disconnected")
    const activePhone = session?.phone_jid || (gowaConnected ? gowaJid : null)
    const activeName = session?.display_name || (gowaConnected ? gowaDisplay : null)
    return NextResponse.json({
      status,
      phone: activePhone,
      name: activeName,
      message: session?.error_message || null,
    })

  } catch (error: any) {
    console.error("[API_STATUS_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
