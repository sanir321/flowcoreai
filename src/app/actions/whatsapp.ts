"use server"

import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppText, checkGoWASessionHealth, getChats, getChatMessages } from "@/lib/gowa";
import { typingDelay } from "@/lib/whatsapp";

// Helper to initialize Supabase Admin (Service Role)
// This is private to the server and won't be exposed to the client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. This action must run on the server.");
  }
  
  return createClient(url, key);
}

interface ProcessMessageInput {
  phone: string;
  message: string;
  senderName: string;
  messageId: string;
  channel: 'whatsapp';
  sessionId?: string;
}

/**
 * Process incoming WhatsApp messages asynchronously
 */
export async function processIncomingWhatsAppMessage(input: ProcessMessageInput) {
  try {
    const { phone, message, senderName, messageId, sessionId } = input;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Deduplication
    const { data: existing } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("gowa_message_id", messageId)
      .maybeSingle();

    if (existing) {
      console.log(`[WHATSAPP] Duplicate message ignored: ${messageId}`);
      return;
    }

    // 2. Resolve Workspace
    if (!sessionId) {
      console.error("[WHATSAPP] No session ID provided");
      return;
    }

    const { data: gowaSession } = await supabaseAdmin
      .from("gowa_sessions")
      .select("workspace_id")
      .eq("gowa_session_id", sessionId)
      .single();

    if (!gowaSession) {
      console.error(`[WHATSAPP] No workspace found for session: ${sessionId}`);
      return;
    }
    const workspaceId = gowaSession.workspace_id;

    // 3. Resolve/Create Contact
    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .upsert({
        workspace_id: workspaceId,
        whatsapp_jid: `${phone}@s.whatsapp.net`,
        phone: phone,
        name: senderName,
        channel: "whatsapp"
      }, { onConflict: "workspace_id, whatsapp_jid" })
      .select()
      .single();

    if (!contact) return;

    // 4. Resolve/Create Active Conversation Session
    let { data: activeSession } = await supabaseAdmin
      .from("conversation_sessions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("customer_jid", `${phone}@s.whatsapp.net`)
      .eq("status", "active")
      .maybeSingle();

    if (!activeSession) {
      const { data: newSession } = await supabaseAdmin
        .from("conversation_sessions")
        .insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          customer_jid: `${phone}@s.whatsapp.net`,
          customer_name: senderName,
          channel: "whatsapp",
          agent_type: "customer_support",
          status: "active"
        })
        .select()
        .single();
      activeSession = newSession;
    }

    if (!activeSession) return;

    // 5. Update session window
    await supabaseAdmin
      .from("conversation_sessions")
      .update({ 
        last_customer_message_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        last_message_preview: message.substring(0, 100),
        message_count: (activeSession.message_count || 0) + 1
      })
      .eq("id", activeSession.id);

    // 6. Store Inbound Message
    await supabaseAdmin
      .from("messages")
      .insert({
        workspace_id: workspaceId,
        session_id: activeSession.id,
        content: message,
        direction: "inbound",
        role: "customer",
        gowa_message_id: messageId
      });

    // 7. Invoke AI Orchestrator
    const { data: aiResponse, error: aiError } = await supabaseAdmin.functions.invoke("agent-orchestrator", {
      body: {
        workspace_id: workspaceId,
        session_id: activeSession.id,
        message: message,
        customer_name: senderName || "Customer",
        agent_type: "customer_support"
      }
    });

    if (aiError || !aiResponse?.response_parts) return;

    // 8. Deliver Response Parts via GoWA
    for (const part of aiResponse.response_parts) {
      const delay = typingDelay(part.length);
      await new Promise(resolve => setTimeout(resolve, delay));
      await sendWhatsAppText(workspaceId, phone, part);
    }

  } catch (err) {
    console.error("[WHATSAPP] Process Inbound Error:", err);
  }
}

/**
 * Health Check Cron / Task
 */
export async function runGoWAHealthCheck() {
  const isHealthy = await checkGoWASessionHealth();
  return isHealthy;
}

/**
 * Manually synchronize all chat history from GoWA for a workspace
 */
export async function syncWhatsAppHistory(workspaceId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Get Device ID for workspace
    const { data: wsSession } = await supabaseAdmin
      .from('gowa_sessions')
      .select('gowa_session_id')
      .eq('workspace_id', workspaceId)
      .single();

    if (!wsSession?.gowa_session_id) throw new Error("No WhatsApp connection found");
    const deviceId = wsSession.gowa_session_id;

    // 2. Fetch all chats
    const chats = await getChats(deviceId);

    let totalSynced = 0;

    for (const chat of chats) {
      if (chat.jid === 'status@broadcast') continue;

      // 3. Resolve Contact
      const { data: contact, error: cError } = await supabaseAdmin
        .from('contacts')
        .upsert({
          workspace_id: workspaceId,
          whatsapp_jid: chat.jid,
          name: chat.name || "WhatsApp User",
          phone: chat.jid.split('@')[0],
          channel: 'whatsapp',
          last_active: chat.last_message_time
        }, { onConflict: 'workspace_id, phone' })
        .select()
        .single();

      if (cError) continue;

      // 4. Resolve/Create Session
      let { data: session } = await supabaseAdmin
        .from('conversation_sessions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('customer_jid', chat.jid)
        .eq('status', 'active')
        .maybeSingle();

      if (!session) {
        const { data: newSession } = await supabaseAdmin
          .from('conversation_sessions')
          .insert({
            workspace_id: workspaceId,
            contact_id: contact.id,
            customer_jid: chat.jid,
            customer_name: contact.name,
            channel: 'whatsapp',
            agent_type: 'customer_support',
            status: 'active',
            last_message_at: chat.last_message_time
          })
          .select()
          .single();
        session = newSession;
      }

      // 5. Fetch and Sync Messages
      const messages = await getChatMessages(deviceId, chat.jid, 20);
      if (messages && messages.length > 0) {
        const messagesToInsert = messages.map(m => ({
          workspace_id: workspaceId,
          session_id: session!.id,
          content: m.content || m.text || "",
          direction: m.is_from_me ? 'outbound' : 'inbound',
          role: m.is_from_me ? 'agent' : 'customer',
          gowa_message_id: m.id,
          created_at: m.timestamp
        }));

        await supabaseAdmin
          .from('messages')
          .upsert(messagesToInsert, { onConflict: 'gowa_message_id' });
        
        await supabaseAdmin
            .from('conversation_sessions')
            .update({ 
                last_message_preview: (messages[0].content || messages[0].text || "")?.substring(0, 100),
                last_message_at: messages[0].timestamp
            })
            .eq('id', session!.id);
      }

      totalSynced++;
    }

    return { data: { success: true, count: totalSynced }, error: null };
  } catch (err: any) {
    console.error("[SYNC_ERROR]", err);
    return { data: null, error: err.message || "Failed to synchronize history" };
  }
}
