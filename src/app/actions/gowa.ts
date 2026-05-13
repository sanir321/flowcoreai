"use server"

import { createClient } from "@/lib/supabase/server"
import { initiateQRLogin, logoutSession } from "@/lib/gowa"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"

export async function initializeGowa(workspaceId: string): Promise<ActionResponse<{ qrCode: string }>> {
  try {
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // 1. Check if session already exists
    const sessionId = `session_${workspaceId}`
    
    // 2. Call GoWA API to get real QR code
    const result = await initiateQRLogin(sessionId)
    
    // 3. Upsert session record in DB
    await supabase.from("gowa_sessions").upsert({
      workspace_id: workspaceId,
      gowa_session_id: sessionId,
      status: "qr_pending",
      updated_at: new Date().toISOString()
    })

    revalidatePath("/settings")
    return { data: { qrCode: result.qr_code }, error: null }

  } catch (err: any) {
    console.error("Gowa Init Error:", err)
    return { data: null, error: "Failed to initialize WhatsApp. Is the GoWA server running?" }
  }
}

export async function disconnectGowa(workspaceId: string): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = (await createClient()) as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const sessionId = `session_${workspaceId}`
    
    // 1. Call GoWA API to logout
    try {
      await logoutSession(sessionId)
    } catch (e) {
      console.warn("GoWA logout failed (might already be logged out):", e)
    }

    // 2. Update DB
    await supabase
      .from("gowa_sessions")
      .update({ status: "disconnected", phone_jid: null, display_name: null })
      .eq("workspace_id", workspaceId)

    revalidatePath("/settings")
    return { data: { success: true }, error: null }

  } catch (err: any) {
    console.error("Gowa Disconnect Error:", err)
    return { data: null, error: "Failed to disconnect" }
  }
}
