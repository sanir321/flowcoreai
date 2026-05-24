import { PipelineContext } from "./types.ts";

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

  // 1. Try to find existing active session (latest first)
  let { data: session } = await supabase
    .from('conversation_sessions')
    .select('*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config)')
    .eq('workspace_id', workspace_id)
    .eq('customer_jid', customer_jid)
    .eq('status', 'active')
    .is("deleted_at", null)
    .order('created_at', { ascending: false })
    .limit(1)
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

export async function touchSession(ctx: PipelineContext, agentType: string, finalResponse: string, tokensUsed = 0) {
  await ctx.supabase.from("conversation_sessions")
    .update({
      agent_type: agentType,
      last_message_at: new Date().toISOString(),
      last_message_preview: finalResponse.substring(0, 100),
      message_count: (ctx.session.message_count || 0) + 1,
      total_tokens_used: (ctx.session.total_tokens_used || 0) + tokensUsed,
      updated_at: new Date().toISOString()
    })
    .eq("id", ctx.session.id);
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
