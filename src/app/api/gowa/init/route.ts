// /app/api/gowa/init/route.ts
import { createClient } from "@/lib/supabase/server"
import { initiateQRLogin } from "@/lib/gowa"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    // Look up the active workspace directly from the DB for reliability
    const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .maybeSingle()

    if (!workspace) {
      return new NextResponse("No active workspace found for user.", { status: 404 })
    }

    // Use the robust, unified function from the GOWA library
    const qrData = await initiateQRLogin(workspace.id)

    if (!qrData.qr_code) {
      throw new Error("QR code not returned by the initialization function.");
    }

    return NextResponse.json({ qr_code: qrData.qr_code })

  } catch (error: any) {
    console.error("[API_INIT_ERROR]", error)
    return new NextResponse(error.message || "Internal Server Error", { status: 500 })
  }
}
