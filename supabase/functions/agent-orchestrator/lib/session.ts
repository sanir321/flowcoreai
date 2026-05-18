/**
 * /app/actions/session.ts (Implementation for Edge Function)
 * Session management for FlowCore Agent.
 */

export async function getOrCreateSession(supabase: any, { 
  workspace_id, 
  customer_jid, 
  channel, 
  agent_type 
}: { 
  workspace_id: string; 
  customer_jid: string; 
  channel: string;
  agent_type: string;
}) {
  // Normalize channel to DB-valid values
  const dbChannel = channel === 'webchat' ? 'widget' : channel;

  // 1. Try to find existing active session
  let { data: session, error } = await supabase
    .from('conversation_sessions')
    .select('*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config)')
    .eq('workspace_id', workspace_id)
    .eq('customer_jid', customer_jid)
    .eq('status', 'active')
    .is("deleted_at", null)
    .maybeSingle();

  if (!session) {
    // 2. Resolve Contact ID
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq(channel === 'whatsapp' ? 'whatsapp_jid' : 'session_token', customer_jid)
      .is("deleted_at", null)
      .maybeSingle();

    let contact_id = contact?.id;

    if (!contact_id) {
       const { data: newContact } = await supabase
         .from('contacts')
          .insert({
            workspace_id,
            [channel === 'whatsapp' ? 'whatsapp_jid' : 'session_token']: customer_jid,
            channel: dbChannel
          })
         .select('id')
         .single();
       contact_id = newContact.id;
    }

    // 3. Create new session
    const { data: newSession, error: createError } = await supabase
      .from('conversation_sessions')
      .insert({
        workspace_id,
        contact_id,
        channel: dbChannel,
        customer_jid,
        agent_type,
        status: 'active',
        failed_attempts: 0,
        message_count: 0
      })
      .select('*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config)')
      .single();
    
    if (createError) throw createError;
    session = newSession;
  }

  return session;
}

export async function updateSessionState(supabase: any, sessionId: string, updates: any) {
  const { error } = await supabase
    .from('conversation_sessions')
    .update({
        ...updates,
        updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
    
  if (error) console.error("[SESSION] Update failed:", error.message);
}
