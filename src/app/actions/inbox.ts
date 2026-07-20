"use server"

import { createClient } from "@/lib/supabase/server"
import { SendManualReplySchema, ResolveEscalationSchema, TakeOverSessionSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { sendTextMessage } from "@/lib/gowa"
import { ActionResponse } from "./workspace"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

export async function takeOverSession(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = TakeOverSessionSchema.safeParse(input)
    if (!result.success) return { data: null, error: result.error.issues[0]?.message || "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) return { data: null, error: "No workspace" }

    const { session_id } = result.data

    const { data: session } = await supabase
      .from("conversation_sessions")
      .select("workspace_id")
      .eq("id", session_id)
      .single()

    if (!session) return { data: null, error: "Session not found" }
    if (session.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("conversation_sessions")
      .update({ status: 'escalated' })
      .eq("id", session_id)

    if (error) return { data: null, error: "Failed to take over session" }

    revalidatePath("/inbox")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to take over session" }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendManualReply(input: unknown): Promise<ActionResponse<any>> {
  try {
    const result = SendManualReplySchema.safeParse(input)
    if (!result.success) return { data: null, error: result.error.issues[0]?.message || "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) return { data: null, error: "No workspace" }

    const { session_id, content } = result.data

    // Fetch session details
    const { data: session } = await supabase
      .from("conversation_sessions")
      .select("*, contacts!inner(phone)")
      .eq("id", session_id)
      .single()

    if (!session) return { data: null, error: "Session not found" }
    if (session.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    // Insert outbound message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        workspace_id: workspaceId,
        session_id,
        content,
        role: 'agent',
        direction: 'outbound',
        metadata: { manual_reply: true, operator_id: user.id }
      })
      .select()
      .single()

    if (msgError) return { data: null, error: "Failed to send message" }

    // Update session metadata
    await supabase
      .from("conversation_sessions")
      .update({ 
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100)
      })
      .eq("id", session_id)

    // If WhatsApp, dispatch via GoWA
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (session.channel === 'whatsapp' && (session.contacts as any)?.phone) {
       try {
          // Fetch the workspace-specific device ID
          const { data: gSession } = await supabase
            .from("gowa_sessions")
            .select("gowa_session_id")
            .eq("workspace_id", workspaceId)
            .maybeSingle()
          
          if (gSession?.gowa_session_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await sendTextMessage(gSession.gowa_session_id, (session.contacts as any).phone, content)
          } else {
            console.error("No GoWA session found for workspace", workspaceId)
          }
       } catch (e) {
          console.error("GoWA dispatch failed:", e)
          return { data: null, error: "Failed to dispatch WhatsApp message. Internal GoWA error." }
       }
    }

    revalidatePath("/inbox")
    return { data: message, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to send message" }
  }
}

export async function resolveEscalation(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = ResolveEscalationSchema.safeParse(input)
    if (!result.success) return { data: null, error: result.error.issues[0]?.message || "Invalid input" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id)
    if (!workspaceId) return { data: null, error: "No workspace" }

    const { escalation_id, notes } = result.data

    // Fetch escalation to verify workspace ownership
    const { data: escalation } = await supabase
      .from("escalation_logs")
      .select("workspace_id, session_id")
      .eq("id", escalation_id)
      .single()

    if (!escalation) return { data: null, error: "Escalation not found" }
    if (escalation.workspace_id !== workspaceId) return { data: null, error: "Unauthorized" }

    // 1. Resolve the log
    const { error: logError } = await supabase
      .from("escalation_logs")
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        notes
      })
      .eq("id", escalation_id)

    if (logError) return { data: null, error: "Failed to resolve escalation" }

    // 2. Set session back to active
    await supabase
      .from("conversation_sessions")
      .update({ status: 'active' })
      .eq("id", escalation.session_id)

    revalidatePath("/inbox")
    revalidatePath("/agent-hub/escalations")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to resolve escalation" }
  }
}
