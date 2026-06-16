// /app/api/gowa/init/route.ts
import { createClient } from "@/lib/supabase/server"
import { initiateQRLogin } from "@/lib/gowa"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

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
    if (!workspaceId) {
      return new NextResponse("No active workspace found for user.", { status: 404 })
    }

    // Get stored device ID if any
    const { data: existingSession } = await supabase
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle()

    const qrData = await initiateQRLogin(workspaceId, existingSession?.gowa_session_id)

    if (!qrData.qr_code) {
      throw new Error("QR code not returned by the initialization function.");
    }

    // Save GoWA device session to DB
    await supabase
      .from("gowa_sessions")
      .upsert({
        workspace_id: workspaceId,
        gowa_session_id: qrData.device_id,
        status: "qr_pending",
        updated_at: new Date().toISOString(),
      }, { onConflict: "workspace_id" })

    return NextResponse.json({ qr_code: qrData.qr_code })

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("[API_INIT_ERROR]", error)
    return new NextResponse("Failed to initialize connection", { status: 500 })
  }
}
