import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { getDevices, logoutSession, deleteDevice } from "@/lib/gowa"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

/* eslint-disable @typescript-eslint/no-explicit-any */

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

    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) return new NextResponse("No workspace", { status: 400 })

    const { data: dbSession } = await (supabase
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle() as any)

    const deviceName = `Flowter_${workspaceId}`
    try {
      const devices = await getDevices()
      const ourDevice = devices.find((d: any) =>
        d.name === deviceName || d.id === dbSession?.gowa_session_id
      )

      if (ourDevice) {
        await logoutSession(ourDevice.id).catch(() => {})
        await deleteDevice(ourDevice.id).catch(() => {})
      }
    } catch (e) {
      console.error("[LOGOUT_GOWA_ERROR]", e)
    }

    const { error: updateError } = await (supabase.from("gowa_sessions") as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)

    if (updateError) {
      console.error("[LOGOUT_DB_UPDATE_FAILED]", updateError)
      return NextResponse.json({ status: 'partial', message: 'GoWA session disconnected but DB update failed' })
    }

    return NextResponse.json({ status: 'ok', message: 'Session disconnected' })

  } catch (error: any) {
    console.error("[API_LOGOUT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
