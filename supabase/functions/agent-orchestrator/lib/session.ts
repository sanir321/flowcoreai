import { PipelineContext, WorkingContext } from "./types.ts";

export async function getOrCreateSession(supabase: any, { 
  workspace_id, 
  customer_jid, 
  channel, 
  agent_type,
  customer_name,
}: { 
  workspace_id: string; 
  customer_jid: string; 
  channel: string;
  agent_type: string;
  customer_name?: string;
}) {
  const VALID_AGENT_TYPES = ["customer_support", "appointment_booking", "sales"];
  const AGENT_TYPE_ALIASES: Record<string, string> = {
    "booking": "appointment_booking",
    "book": "appointment_booking",
  };
  const dbAgentType = AGENT_TYPE_ALIASES[agent_type] || agent_type;
  agent_type = VALID_AGENT_TYPES.includes(dbAgentType) ? dbAgentType : "customer_support";

  const ALLOWED_CHANNELS = ["whatsapp", "widget", "api", "test"];
  const dbChannel = ALLOWED_CHANNELS.includes(channel) ? channel : 'widget';

  let { data: session } = await supabase
    .from('conversation_sessions')
    .select('*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config, kb_config, services_offered, description, business_profile, website_url, business_type)')
    .eq('workspace_id', workspace_id)
    .eq('customer_jid', customer_jid)
    .eq('status', 'active')
    .is("deleted_at", null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    const { data: escalatedSession } = await supabase
      .from('conversation_sessions')
      .select('*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config, kb_config, services_offered, description, business_profile, website_url, business_type)')
      .eq('workspace_id', workspace_id)
      .eq('customer_jid', customer_jid)
      .eq('status', 'escalated')
      .is("deleted_at", null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (escalatedSession) {
      session = escalatedSession;
    }
  }

  if (!session) {
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
             channel: dbChannel,
             name: customer_name || null,
             phone: channel === 'whatsapp' ? customer_jid.split('@')[0] : null,
           })
         .select('id')
         .single();
       contact_id = newContact.id;
    }

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
        message_count: 0,
        working_context: {
          intent: null,
          collected_data: {},
          customer_name: null,
          pending_action: null,
          agent_type: agent_type || "customer_support",
          handoff_count: 0,
          sentiment: null
        }
      })
      .select('*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config, kb_config, services_offered, description, business_profile, website_url, business_type)')
      .single();
    
    if (createError) throw createError;
    session = newSession;
  }

  if (!session.working_context) {
    session.working_context = {
      intent: null,
      collected_data: {},
      customer_name: null,
      pending_action: null,
      agent_type: session.agent_type || "customer_support",
      handoff_count: 0,
      sentiment: null
    };
  }

  return session;
}

export async function touchSession(ctx: PipelineContext, agentType: string, finalResponse: string, tokensUsed = 0) {
  const wc = ctx.session.working_context;
  const updateData: any = {
    agent_type: agentType,
    last_message_at: new Date().toISOString(),
    last_message_preview: finalResponse.substring(0, 100),
    message_count: (ctx.session.message_count || 0) + 1,
    total_tokens_used: (ctx.session.total_tokens_used || 0) + tokensUsed,
    updated_at: new Date().toISOString()
  };

  if (ctx._sentiment && ctx._sentiment !== (wc?.sentiment || null)) {
    updateData.working_context = { ...(wc || {}), sentiment: ctx._sentiment };
  }

  await ctx.supabase.from("conversation_sessions")
    .update(updateData)
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
