import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || ""
const GOWA_API_KEY = process.env.GOWA_API_KEY || ""
const GOWA_AUTH = GOWA_API_KEY ? Buffer.from(GOWA_API_KEY).toString("base64") : ""

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const workspaceId = user.app_metadata?.workspace_id as string | undefined
    if (!workspaceId) return new NextResponse("No workspace found for user", { status: 404 })

    // Check DB session
    const { data: session } = await (supabase
        .from("gowa_sessions")
        .select("status, phone_jid, display_name, error_message, gowa_session_id")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .maybeSingle() as any)

    // Check GoWA devices — match by device name or stored session ID only
    // Never fallback to any logged-in device (prevents cross-workspace contamination)
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

        // Match by device name (GoWA may or may not return 'name' field)
        const named = devices.find(d => d.name === deviceName)
        // Match by stored session ID
        const byId = session?.gowa_session_id
          ? devices.find(d => d.id === session.gowa_session_id)
          : null
        // Match by stored phone JID (handles device reconnection with new ID)
        const byJid = session?.phone_jid
          ? devices.find(d => d.jid === session.phone_jid)
          : null
        // Match by display name (GoVA shows name/phone as display_name)
        const byDisplay = devices.find(d =>
          d.display_name && d.display_name.includes(workspaceId.substring(0, 8))
        )

        const candidate = named || byId || byJid || byDisplay
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
