"use server"

import { createClient } from "@/lib/supabase/server"
import { UpdateContactSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"
import { sendWhatsAppText } from "@/lib/gowa"

export async function sendManualMessage(input: {
  workspace_id: string;
  phone: string;
  message: string;
  contact_id: string;
}): Promise<ActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // 1. Send via GoWA
    await sendWhatsAppText(input.workspace_id, input.phone, input.message)

    // 2. Log in database
    // Find or create session
    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('id')
      .eq('workspace_id', input.workspace_id)
      .eq('contact_id', input.contact_id)
      .eq('status', 'active')
      .maybeSingle()

    let activeSessionId = session?.id

    if (!activeSessionId) {
      const { data: newSession, error: sErr } = await supabase
        .from('conversation_sessions')
        .insert({
          workspace_id: input.workspace_id,
          contact_id: input.contact_id,
          channel: 'whatsapp',
          status: 'active'
        })
        .select('id')
        .single()
      if (sErr) throw sErr
      activeSessionId = newSession.id
    }

    const { error: msgErr } = await supabase
      .from('messages')
      .insert({
        workspace_id: input.workspace_id,
        session_id: activeSessionId,
        content: input.message,
        direction: 'outbound',
        role: 'agent',
        metadata: { manual: true }
      })

    if (msgErr) throw msgErr

    // 3. Update session preview
    await supabase
        .from('conversation_sessions')
        .update({
            last_message_preview: input.message,
            updated_at: new Date().toISOString()
        })
        .eq('id', activeSessionId)

    revalidatePath("/inbox")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error("[MANUAL_SEND_ERROR]", err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to send message" }
  }
}

export async function createContact(input: {
  workspace_id: string;
  name: string;
  phone: string;
  email?: string;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        workspace_id: input.workspace_id,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        channel: 'whatsapp',
        whatsapp_jid: `${input.phone}@s.whatsapp.net`
      })
      .select("id")
      .single()

    if (error) {
        if (error.code === '23505') throw new Error("A contact with this phone or email already exists.")
        throw error
    }

    revalidatePath("/contacts")
    return { data: { id: data.id }, error: null }
  } catch (err) {
    console.error("[CREATE_CONTACT_ERROR]", err)
    return { data: null, error: err instanceof Error ? err.message : "Failed to create contact" }
  }
}

export async function updateContact(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = UpdateContactSchema.safeParse(input)
    if (!result.success) return { data: null, error: "Invalid input" }

    const { contact_id, ...updates } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", contact_id)

    if (error) throw error

    revalidatePath("/contacts")
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to update contact" }
  }
}

export async function exportContacts(workspace_id: string): Promise<ActionResponse<{ csv: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspace_id)
      .is("deleted_at", null)

    if (error) throw error

    // Simple CSV generation
    const headers = ["Name", "Phone", "Email", "Channel", "Last Active", "Conversation Count"]
    const rows = (contacts || []).map((c) => [
      c.name || "",
      c.phone || "",
      c.email || "",
      c.channel,
      c.last_active || "",
      c.conversation_count
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(","))
    ].join("\n")

    return { data: { csv: csvContent }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to export contacts" }
  }
}
