"use server"

import { createClient } from "@/lib/supabase/server"
import { UpdateContactSchema } from "@/lib/schemas"
import { revalidatePath } from "next/cache"
import { ActionResponse } from "./workspace"
import { sendWhatsAppText } from "@/lib/gowa"
import { z } from "zod"
import { verifyWorkspaceOwnership, getUserWorkspaceId } from "@/lib/workspace-auth"

export async function sendManualMessage(input: unknown): Promise<ActionResponse<{ success: true }>> {
  try {
    const result = z.object({
      workspace_id: z.string().uuid(),
      phone: z.string().min(5),
      message: z.string().min(1),
      contact_id: z.string().uuid(),
    }).safeParse(input)

    if (!result.success) return { data: null, error: "Invalid request data" }

    const { workspace_id, phone, message, contact_id } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, workspace_id)
    if (!auth.authorized) return { data: null, error: auth.error }

    // 1. Send via GoWA
    await sendWhatsAppText(workspace_id, phone, message)

    // 2. Log in database
    // Find or create session
    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('contact_id', contact_id)
      .eq('status', 'active')
      .maybeSingle()

    let activeSessionId = session?.id

    if (!activeSessionId) {
      const { data: newSession, error: sErr } = await supabase
        .from('conversation_sessions')
        .insert({
          workspace_id,
          contact_id,
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
        workspace_id,
        session_id: activeSessionId,
        content: message,
        direction: 'outbound',
        role: 'agent',
        metadata: { manual: true }
      })

    if (msgErr) throw msgErr

    // 3. Update session preview
    await supabase
        .from('conversation_sessions')
        .update({
            last_message_preview: message,
            updated_at: new Date().toISOString()
        })
        .eq('id', activeSessionId)

    revalidatePath("/inbox")
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error("[MANUAL_SEND_ERROR]", err)
    return { data: null, error: "Failed to send message" }
  }
}

export async function createContact(input: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const result = z.object({
      workspace_id: z.string().uuid(),
      name: z.string().min(1),
      phone: z.string().min(5),
      email: z.string().email().optional().or(z.literal("")),
    }).safeParse(input)

    if (!result.success) return { data: null, error: "Invalid contact data" }

    const { workspace_id, name, phone, email } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, workspace_id)
    if (!auth.authorized) return { data: null, error: auth.error }

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        workspace_id,
        name,
        phone,
        email: email || null,
        channel: 'whatsapp',
        whatsapp_jid: `${phone}@s.whatsapp.net`
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
    return { data: null, error: "Failed to create contact" }
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

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const userWsId = await getUserWorkspaceId(supabase, user.id)
    if (!userWsId) return { data: null, error: "No workspace assigned" }

    // Verify contact belongs to user's workspace before update
    const { data: contact } = await supabase
      .from("contacts")
      .select("workspace_id")
      .eq("id", contact_id)
      .maybeSingle()

    if (!contact || contact.workspace_id !== userWsId) {
      return { data: null, error: "Unauthorized" }
    }

    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", contact_id)
      .eq("workspace_id", userWsId)

    if (error) throw error

    revalidatePath("/contacts")
    return { data: { success: true }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to update contact" }
  }
}

export async function getContactsPaginated(
  workspace_id: string,
  offset: number = 0,
  limit: number = 10
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActionResponse<{ contacts: any[], total: number | null }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, workspace_id)
    if (!auth.authorized) return { data: null, error: auth.error }

    const { data: contacts, count, error } = await supabase
      .from("contacts")
      .select("*, appointments(count)", { count: "exact" })
      .eq("workspace_id", workspace_id)
      .is("deleted_at", null)
      .order("last_active", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return { data: { contacts: contacts || [], total: count }, error: null }
  } catch (err) {
    console.error("[GET_CONTACTS_ERROR]", err)
    return { data: null, error: "Failed to load contacts" }
  }
}

export async function exportContacts(workspace_id: string): Promise<ActionResponse<{ csv: string }>> {
  try {
    const res = z.string().uuid().safeParse(workspace_id)
    if (!res.success) return { data: null, error: "Invalid workspace ID" }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Unauthorized" }

    // IDOR Check: verify ownership via DB (not stale JWT app_metadata)
    const auth = await verifyWorkspaceOwnership(supabase, user.id, res.data)
    if (!auth.authorized) return { data: null, error: auth.error }

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", res.data)
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
    ].map(cell => {
      const s = String(cell);
      // Prevent CSV injection: prefix formula-triggering chars with single quote
      if (/^[=+\-@\t]/.test(s)) return `'${s}`;
      return s;
    }))

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map(cell => {
        const s = String(cell);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }).join(","))
    ].join("\n")

    return { data: { csv: csvContent }, error: null }

  } catch (err) {
    console.error(err)
    return { data: null, error: "Failed to export contacts" }
  }
}
