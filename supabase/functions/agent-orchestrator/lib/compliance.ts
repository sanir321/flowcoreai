import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const TYPING_SPEED_MS_PER_CHAR = 35;
const MAX_TYPING_DELAY_MS = 4000;
const WHATSAPP_WINDOW_HOURS = 24;

export async function checkWhatsAppWindow(supabase: SupabaseClient, sessionId: string): Promise<{ expired: boolean }> {
  const { data: session, error } = await supabase
    .from('conversation_sessions')
    .select('last_customer_message_at')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error(`[COMPLIANCE] Error fetching session ${sessionId}:`, error.message);
    return { expired: false };
  }

  if (!session?.last_customer_message_at) return { expired: false };

  const lastMessageAt = new Date(session.last_customer_message_at);
  const now = new Date();
  const diffMs = now.getTime() - lastMessageAt.getTime();
  const hoursSinceLastMessage = diffMs / (1000 * 60 * 60);

  return { expired: hoursSinceLastMessage > WHATSAPP_WINDOW_HOURS };
}

export function calculateTypingDelay(message: string): number {
  return Math.min(message.length * TYPING_SPEED_MS_PER_CHAR, MAX_TYPING_DELAY_MS);
}

export async function logWindowExpired(supabase: SupabaseClient, workspaceId: string, sessionId: string): Promise<void> {
  const { error } = await supabase.from('escalation_logs').insert({
    workspace_id: workspaceId,
    session_id: sessionId,
    trigger_type: 'wa_window_expired',
    status: 'open',
    conversation_snapshot: { reason: 'WhatsApp 24-hour window expired' }
  });

  if (error) {
    console.error(`[COMPLIANCE] Error logging window expiry for session ${sessionId}:`, error.message);
  }
}
