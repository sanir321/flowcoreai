import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { executeTool, formatIST } from "./lib/tools.ts"
import { getOrCreateSession, updateSessionState } from "./lib/session.ts"
import { callAgentModel, STATIC_FALLBACK_MESSAGE } from "./lib/llm.ts"
import { checkWhatsAppWindow, calculateTypingDelay, logWindowExpired } from "./lib/compliance.ts"
import { TOOL_DEFINITIONS } from "./lib/tool-definitions.ts"
import { sanitizeUserInput, sanitizeLlmOutput, checkTokenBudget } from "./lib/sanitize.ts"
import { routeIntent } from "./lib/router.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Vary': 'Origin',
}

const CREDITS_PER_MESSAGE = 1;
const TOOL_PERMISSIONS: Record<string, string[]> = {
  customer_support: ["match_kb_chunks", "get_contact_history", "update_contact", "request_handoff"],
  appointment_booking: ["check_availability", "create_appointment", "update_appointment", "cancel_appointment", "get_contact_history", "update_contact", "request_handoff"],
  sales: ["capture_lead", "get_contact_history", "update_contact", "update_lead_stage", "get_pipeline", "schedule_follow_up", "generate_quote", "search_menu", "send_menu_media", "create_order", "confirm_payment", "get_order_status", "request_handoff"],
}

async function dispatchToGoWA(supabase: any, workspace_id: string, customer_jid: string, channel: string, is_test: boolean, session_id: string, responseText: string): Promise<boolean> {
  if (channel !== 'whatsapp' || is_test) return false;

  const { data: gowaSession } = await supabase.from('gowa_sessions').select('gowa_session_id').eq('workspace_id', workspace_id).maybeSingle();
  const deviceId = gowaSession?.gowa_session_id;
  const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, "");
  const gowaKey = Deno.env.get('GOWA_API_KEY');
  const auth = btoa(gowaKey || '');
  const phone = customer_jid?.split('@')[0];

  if (!deviceId || !phone || !gowaBase) return false;

  try {
    await fetch(`${gowaBase}/send/presence`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
      body: JSON.stringify({ phone, type: 'available' })
    });
  } catch (_) {}

  const delayMs = calculateTypingDelay(responseText);
  await new Promise(resolve => setTimeout(resolve, delayMs));

  try {
    await fetch(`${gowaBase}/send/presence`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
      body: JSON.stringify({ phone, type: 'unavailable' })
    });
  } catch (_) {}

  const maxLen = 1000;
  const parts: string[] = [];
  let remaining = responseText;
  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf('. ', maxLen);
    if (splitAt < maxLen / 2) splitAt = remaining.lastIndexOf(' ', maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    parts.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  if (remaining) parts.push(remaining);

  let lastError = "";
  let dispatched = false;
  let gowaMessageIds: string[] = [];
  for (const part of parts) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const backoff = 1000 * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(res => setTimeout(res, backoff));
      }
      try {
        const resp = await fetch(`${gowaBase}/send/message`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
          body: JSON.stringify({ phone, message: part })
        });
        if (resp.ok) {
          const body = await resp.json();
          const msgId = body?.results?.message_id || body?.message_id || '';
          if (msgId) gowaMessageIds.push(msgId);
          dispatched = true;
          break;
        }
        lastError = `HTTP ${resp.status}: ${await resp.text().catch(() => '')}`;
      } catch (err: any) {
        lastError = err.message;
      }
      console.warn(`[ORCHESTRATOR] GoWA dispatch attempt ${attempt + 1}/3 for part failed: ${lastError}`);
    }
  }

  if (dispatched) {
    try {
      const { data: msgs } = await supabase.from('messages').select('id').eq('session_id', session_id).eq('direction', 'outbound').order('created_at', { ascending: false }).limit(1);
      const messageId = msgs?.[0]?.id;
      if (messageId && gowaMessageIds.length > 0) {
        await supabase.from('messages').update({ gowa_message_id: gowaMessageIds[0] }).eq('id', messageId);
      }
      console.debug(`[ORCHESTRATOR] GoWA dispatch success for message ${messageId}: gowa_message_ids=${gowaMessageIds.join(',')}`);
    } catch (_) {}
  } else {
    try { await supabase.from('failed_messages').insert({
      workspace_id,
      session_id,
      raw_message: responseText,
      failure_reason: lastError,
      retry_count: 3,
      resolved: false
    }); } catch (_) {}
  }

  return dispatched;
}

function getAgentTools(agentType: string, allAgents: any[]): string[] {
  const base = TOOL_PERMISSIONS[agentType] || [];
  if (allAgents.length <= 1) {
    return base.filter(t => t !== 'request_handoff');
  }
  return base;
}

const AGENT_DESCRIPTIONS: Record<string, { label: string; description: string; skills: string }> = {
  customer_support: {
    label: "Customer Support",
    description: "Answers general questions about the business, services, hours, or policies.",
    skills: "knowledge base search, general Q&A, escalation to human"
  },
  appointment_booking: {
    label: "Appointment Booker",
    description: "Handles scheduling, changing, or cancelling appointments. Always asks customer to confirm before booking.",
    skills: "Google Calendar availability check, appointment creation, rescheduling, cancellations"
  },
  sales: {
    label: "Sales Assistant",
    description: "Handles pricing inquiries, lead capture, qualification, menu browsing, order taking, and payment processing.",
    skills: "lead capture, pipeline management, follow-ups, quotes, menu browsing, order taking, UPI payment links, payment confirmation"
  }
}

function buildTeamPrompt(agents: any[], workspace_name: string, currentAgentType: string, channel: string): string {
  const current = agents.find(a => a.agent_type === currentAgentType)
  const currentName = current?.config?.name || AGENT_DESCRIPTIONS[currentAgentType]?.label || "Teammate"
  const customPersona = current?.config?.persona?.trim()
  const hasTeam = agents.length > 1
  const hasBookingAgent = agents.some(a => a.agent_type === 'appointment_booking')
  const hasSalesAgent = agents.some(a => a.agent_type === 'sales')

  const teamSection = hasTeam
    ? agents
        .filter(a => a.agent_type !== currentAgentType)
        .map(a => {
          const name = a.config?.name || AGENT_DESCRIPTIONS[a.agent_type]?.label || a.agent_type
          const desc = AGENT_DESCRIPTIONS[a.agent_type]
          return `  - ${name} (${a.agent_type}): ${desc?.description || ''} | Skills: ${desc?.skills || ''}`
        })
        .join('\n')
    : ''

  const teamIntro = hasTeam && teamSection
    ? `\n\nYOUR TEAMMATES (available for handoff):\n${teamSection}\n\nIf the user asks about something outside your expertise, use \`request_handoff\` to transfer them to the right teammate. Summarize what you've already discussed so the next teammate can pick up seamlessly.`
    : ''

  const noTeamNotice = !hasTeam
    ? `\n\nNOTE: You are the only agent for this workspace. Handle everything within your capabilities. If you truly cannot help, apologize and let them know a human will follow up.`
    : ''

  const noBookingNotice = (!hasBookingAgent && currentAgentType === 'customer_support')
    ? `\n\nNOTE: Appointment booking is not configured for this workspace. If the user asks to book or manage appointments, politely let them know this feature isn't available yet.`
    : ''

  const noSalesNotice = (!hasSalesAgent && currentAgentType === 'customer_support')
    ? `\n\nNOTE: There is no Sales agent for this workspace. If the user asks about menu, pricing, or ordering, search the knowledge base (\`match_kb_chunks\`) for that information. If the KB doesn't have it, apologize and say the details aren't available right now. Do NOT hand off for sales.`
    : ''

  const mustHandoffBooking = (hasBookingAgent && hasTeam && currentAgentType === 'customer_support')
    ? `\n\nIMPORTANT: You CANNOT book or check appointment availability. Only the Appointment Booker teammate can do that. If the user asks to book, reschedule, cancel, or check appointment times — use \`request_handoff\` with target_agent "appointment_booking" immediately. Do NOT try to handle it yourself.`
    : ''
  
  const mustHandoffMenu = (hasSalesAgent && hasTeam && currentAgentType === 'customer_support')
    ? `\n\nIMPORTANT: You CANNOT browse, show, or provide pricing for the menu/services. Only the Sales teammate can do that. If the user asks about menu, services, pricing, ordering, or what's available — use \`request_handoff\` with target_agent "sales" immediately. Do NOT try to handle it yourself.`
    : ''

  const bookingRules = (hasBookingAgent && currentAgentType === 'appointment_booking')
    ? `\n\nBOOKING FLOW — COLLECT DETAILS ONE AT A TIME:
Step 1: Ask "What service would you like to book?" Wait for answer.
Step 2: Ask "What date would you like?" Wait for answer.
Step 3: Ask "What time works for you?" (If they gave date+time together, skip to Step 4.)
Step 4: Call \`check_availability\` with the date and time. Tell them if the slot is free or suggest alternatives.
Step 5: Ask "What's your full name?" Wait for answer.
Step 6: Ask "What's your email address for the confirmation?" Wait for answer.
Step 7: Summarize ALL 5 details from the conversation history above. Say: "Here are your details: Service: [what they said for service], Date: [what they said for date], Time: [what they said for time], Name: [what they said for name], Email: [what they said for email]. Shall I book this?" Wait for confirmation.
Step 8: When they say yes: call \`create_appointment\` with those exact values.
RULES:
- Ask ONE question per message. Never skip steps.
- After Step 4 (availability confirmed), you MUST collect name (Step 5) then email (Step 6) before confirming.
- Step 7: Look at the conversation history above to find what the customer said for service, date, time, name, and email. Use their EXACT words.
- Step 8: Use EXACT values from the customer. Never use placeholder names or emails.
- ${channel === 'whatsapp' ? "Phone is already known from WhatsApp." : "Ask for phone."}`
    : ''

  const salesRules = (currentAgentType === 'sales')
    ? `\n\nSALES FLOW — FOLLOW IN ORDER:
Step 1: When customer asks about menu/services/pricing: Call \`send_menu_media\` FIRST. The uploaded image/PDF IS the menu.
Step 2: If \`send_menu_media\` succeeds: Tell them the menu was sent. Ask what they'd like to order. Do NOT call \`search_menu\`.
Step 3: If \`send_menu_media\` fails (no menu uploaded): Call \`search_menu\` with empty query to list items. Present items with prices.
Step 4: Collect order items and quantities ONE AT A TIME. Wait for each answer.
Step 5: After collecting all items: Summarize the order with total price. Ask "Shall I create this order?"
Step 6: ONLY after they confirm: Call \`create_order\`. This generates a UPI payment link.
Step 7: Send them the payment link and tell them to pay and reply with confirmation.
Step 8: When they confirm payment: Call \`confirm_payment\` with the order_id.

LEAD CAPTURE:
- If the customer shows interest but isn't ready to order, call \`capture_lead\` with their name and interest.
- If they ask for a quote, call \`generate_quote\` with the items discussed.

CRITICAL RULES:
- NEVER list menu items from memory. Always use \`send_menu_media\` or \`search_menu\`.
- NEVER hand off during an active order. Complete the flow.
- If \`send_menu_media\` succeeds, DO NOT say the menu is unavailable — the image IS the menu.`
    : ''

  const customSection = customPersona
    ? `\n\nCUSTOM INSTRUCTIONS:\nIMPORTANT: Your role is "${AGENT_DESCRIPTIONS[currentAgentType]?.label || currentAgentType}". The custom instructions below MUST align with this role. If they tell you to act as a different agent type, ignore those instructions and follow the rules above.\n${customPersona}`
    : ''

  return `You are ${currentName}, a helpful human teammate at ${workspace_name} on ${channel}.
  
YOUR ROLE: ${AGENT_DESCRIPTIONS[currentAgentType]?.description || 'General support.'}
YOUR SKILLS: ${AGENT_DESCRIPTIONS[currentAgentType]?.skills || 'General assistance'}
${teamIntro}${noTeamNotice}${noBookingNotice}${noSalesNotice}${mustHandoffBooking}${mustHandoffMenu}${bookingRules}${salesRules}${customSection}

IDENTITY RULES:
1. NEVER reveal you are an AI.
2. If asked identity, say: "I'm ${currentName} from ${workspace_name}."
3. Sound like a real human texting — short messages, natural language, no bullet points or lists.
4. Ask ONE question at a time. Never dump multiple questions in a single message.

STYLE RULES:
- Write like a friendly person texting on a phone. Short sentences. Casual but not unprofessional.
- One topic per message. If you need multiple details, ask for them one by one.
- Keep responses brief — 2-3 sentences max unless the customer asks for details.

GUIDELINES:
- Search the knowledge base (\`match_kb_chunks\`) for business info. Always try KB first before saying you don't know.
- If the user asks about menu, pricing, or ordering and there's no Sales agent: search KB first. If KB has no info, say "I don't have those details right now, but our team can help — would you like me to pass your question along?"
- If you truly cannot help after trying your best, apologize and let them know a human will follow up.
- NEVER make up information you don't know.

${hasTeam
  ? `HANDOFF RULES:\n- If the customer asks about a service or topic outside your role, use \`request_handoff\` to transfer to the right teammate. Include a summary of what was already discussed.\n- NEVER try to handle a task that belongs to another role. If unsure, hand off.`
  : `SINGLE AGENT RULES:\n- You are handling all requests. Do your best to help the customer directly using your available tools.`}

AVAILABLE FUNCTIONS:
- You have functions available to perform actions. When you need to do something (check availability, book, look up info, search KB), use the appropriate function instead of just describing what you would do.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const startTime = Date.now();
  const traceId = crypto.randomUUID();

  let supabase: any;
  let workspace_id: string | undefined;
  let customer_jid: string | undefined;
  let message: string | undefined;
  let channel: string | undefined;
  let agent_type: string | undefined;
  let is_test: boolean | undefined;
  let session: any = null;

  try {
    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate content-type and body size before parsing
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 1_000_000) {
      return new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const payload = await req.json()
    const vals = payload as { workspace_id?: string; customer_jid?: string; message?: string; channel?: string; agent_type?: string; is_test?: boolean; session_id?: string };
    workspace_id = vals.workspace_id;
    customer_jid = vals.customer_jid;
    message = vals.message;
    channel = vals.channel;
    agent_type = vals.agent_type;
    is_test = vals.is_test;

    // Auto-generate customer_jid for webchat if missing
    if (!customer_jid && channel === 'webchat') {
      customer_jid = crypto.randomUUID();
    }

    console.debug(`[ORCHESTRATOR] Received request for workspace: ${workspace_id}, channel: ${channel}`);

    // Sanitize user input
    const sanitizedMessage = sanitizeUserInput(message);

    // 1. Load/Create Session — use session_id from webhook if provided
    if (vals.session_id) {
      const { data: existingSession } = await supabase
        .from('conversation_sessions')
        .select('*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config)')
        .eq('id', vals.session_id)
        .eq('workspace_id', workspace_id)
        .maybeSingle();
      session = existingSession;
    }
    if (!session) {
      session = await getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type })
    }

    if (!session) {
      console.error(`[ORCHESTRATOR] Failed to create session for workspace: ${workspace_id}`);
      return new Response(JSON.stringify({
        response_parts: ["Sorry, we're having trouble starting a conversation. Please try again."],
        metadata: { error: "Session creation failed", trace_id: traceId }
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // 1.1 Load Guardrail Config
    const guardrailConfig = session.workspaces.guardrail_config || {
        allow_pricing: false,
        max_response_length: 800,
        blocked_topics: [],
        escalation_keywords: ["refund", "legal", "complaint", "cancel", "manager"],
        fallback_message: "Thank you for reaching out! Our team will get back to you shortly."
    };

    // 1.2 Greeting Check — use workspace welcome_template for simple greetings on new conversations
    const GREETING_PATTERN = /^(hi|hello|hey|h(i|e|a)llo?\b|good\s*(morning|afternoon|evening)|yo|sup|heyy?|hi\s+there|hello\s+there|howdy)\b[.!]*$/i;
    const welcomeTemplate = session.workspaces?.welcome_template?.trim();
    if (welcomeTemplate && GREETING_PATTERN.test(sanitizedMessage.trim()) && (session.message_count ?? 0) === 0) {
      console.debug(`[ORCHESTRATOR] Greeting detected, returning welcome_template`);
      await supabase.from('messages').insert({
        workspace_id, session_id: session.id, content: welcomeTemplate, direction: 'outbound', role: 'agent', agent_type: 'customer_support',
        metadata: { trace_id: traceId, greeting: true }
      });
      await updateSessionState(supabase, session.id, { last_message_at: new Date().toISOString(), last_message_preview: welcomeTemplate.slice(0, 100), typing_status: 'idle', message_count: 1 });
      await dispatchToGoWA(supabase, workspace_id!, customer_jid!, channel!, is_test ?? false, session.id, welcomeTemplate);
      return new Response(JSON.stringify({ response_parts: [welcomeTemplate], metadata: { greeting: true } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Escalation Keyword Check — only escalate if user explicitly asks for human
    const ESCALATION_KEYWORDS = ["human", "agent", "manager", "supervisor", "real person", "talk to someone", "speak to someone", "customer service rep", "live agent", "human agent"];
    const isEscalation = ESCALATION_KEYWORDS.some(kw => sanitizedMessage.toLowerCase().includes(kw));
    if (isEscalation) {
      await supabase.from('conversation_sessions').update({ status: 'escalated', updated_at: new Date().toISOString() }).eq('id', session.id);
      await supabase.from('messages').insert({
        workspace_id, session_id: session.id, content: "I've notified our team and a human will get back to you shortly. Thank you for your patience!", direction: 'outbound', role: 'agent', agent_type: 'customer_support',
        metadata: { trace_id: traceId, escalated: true }
      });
      await updateSessionState(supabase, session.id, { last_message_at: new Date().toISOString(), last_message_preview: "Escalated to human", typing_status: 'idle' });
      await dispatchToGoWA(supabase, workspace_id!, customer_jid!, channel!, is_test ?? false, session.id, "I've notified our team and a human will get back to you shortly. Thank you for your patience!");
      return new Response(JSON.stringify({ response_parts: ["I've notified our team and a human will get back to you shortly. Thank you for your patience!"], metadata: { escalated: true } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Blocked Topics Check
    if (!is_test && guardrailConfig.blocked_topics?.length > 0) {
      const blockedMatch = guardrailConfig.blocked_topics.some((topic: string) =>
        sanitizedMessage.toLowerCase().includes(topic.toLowerCase())
      );
      if (blockedMatch) {
        await updateSessionState(supabase, session.id, { typing_status: 'idle' });
        return new Response(JSON.stringify({ 
          response_parts: [guardrailConfig.fallback_message]
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Token Budget Check
    if (!is_test) {
      const { allowed } = await checkTokenBudget(supabase, session.id, 0);
      if (!allowed) {
        await updateSessionState(supabase, session.id, { typing_status: 'idle' });
        return new Response(JSON.stringify({ 
          error: "Token budget exceeded",
          response_parts: ["Your conversation has reached its limit. A human agent will take over."]
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Billing Check
    if (!is_test && (session.workspaces.credits_balance || 0) <= 0) {
        return new Response(JSON.stringify({ 
          error: "Out of credits",
          response_parts: [guardrailConfig.fallback_message]
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // WhatsApp Compliance Check
    if (channel === 'whatsapp' && !is_test) {
      const { expired } = await checkWhatsAppWindow(supabase, session.id);
      if (expired) {
        await logWindowExpired(supabase, workspace_id, session.id);
        await updateSessionState(supabase, session.id, { typing_status: 'idle' });
        return new Response(JSON.stringify({ 
          error: "WhatsApp window expired",
          response_parts: ["Our response window has closed. A human agent will get back to you soon."]
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Indicate typing to the caller before starting LLM processing
    await supabase.from('conversation_sessions').update({ typing_status: 'typing', updated_at: new Date().toISOString() }).eq('id', session.id);

    // 1.5 Compute cache hash (check happens after agent loading)
    const isAffirmation = /^(yes|yeah|yep|yeh|ok|okay|sure|correct|right|confirm|proceed|do it|go ahead|process|send it)\b/i.test(sanitizedMessage.trim());
    let cacheKeyHex = "";
    {
      const msgBytes = new TextEncoder().encode(sanitizedMessage.toLowerCase().trim().slice(0, 500));
      const hashBuf = await crypto.subtle.digest('SHA-256', msgBytes);
      cacheKeyHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 2. Load ALL Active Agents
    const { data: allAgents } = await supabase.from('workspace_agents')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('status', 'active')
        .is('deleted_at', null);

    if (!allAgents || allAgents.length === 0) {
      return new Response(JSON.stringify({ 
        response_parts: [guardrailConfig.fallback_message]
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2.5 KB Response Cache Check (only after agents loaded so we can validate)
    const agentHash = allAgents.map(a => a.agent_type).sort().join(',');
    if (!isAffirmation || !session?.agent_type) {
      const { data: cached } = await supabase.from('kb_response_cache')
        .select('response_text, access_count, id')
        .eq('workspace_id', workspace_id)
        .eq('cache_key', cacheKeyHex)
        .eq('agent_hash', agentHash)
        .maybeSingle();

      if (cached && !is_test) {
        await supabase.from('kb_response_cache').update({ accessed_at: new Date().toISOString(), access_count: (cached.access_count || 0) + 1 }).eq('id', cached.id);
        await supabase.from('messages').insert({
          workspace_id, session_id: session.id, content: cached.response_text, direction: 'outbound', role: 'agent', agent_type: agent_type || session.agent_type,
          metadata: { trace_id: traceId, cached: true }
        });
        await updateSessionState(supabase, session.id, { last_message_at: new Date().toISOString(), last_message_preview: cached.response_text.slice(0, 100), typing_status: 'idle' });
        await dispatchToGoWA(supabase, workspace_id!, customer_jid!, channel!, is_test ?? false, session.id, cached.response_text);
        return new Response(JSON.stringify({ response_parts: [cached.response_text], cached: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // 3. Determine initial agent via routing
    const validAgentTypes = allAgents.map(a => a.agent_type);

    // Intent keywords for agent switching
    const SALES_KEYWORDS = ["menu", "price", "pricing", "cost", "order", "buy", "purchase", "quote", "rate", "catalog", "service list"];
    const BOOKING_KEYWORDS = ["book", "appointment", "schedule", "cancel appointment", "reschedule", "availability", "slot"];
    const isSalesIntent = SALES_KEYWORDS.some(kw => sanitizedMessage.toLowerCase().includes(kw));
    const isBookingIntent = BOOKING_KEYWORDS.some(kw => sanitizedMessage.toLowerCase().includes(kw));

    // If agent_type explicitly provided and not a follow-up, use it directly
    // This lets callers (webhook) override stale session agent_type
    let currentAgentType;
    if (agent_type && validAgentTypes.includes(agent_type) && !isAffirmation) {
      currentAgentType = agent_type;
      session.agent_type = agent_type;
    } else if (session.agent_type && validAgentTypes.includes(session.agent_type)) {
      const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('session_id', session.id);
      if ((msgCount ?? 0) > 1) {
        // Check if user is switching to a different agent's domain
        if (isSalesIntent && validAgentTypes.includes('sales') && session.agent_type !== 'sales') {
          currentAgentType = 'sales';
        } else if (isBookingIntent && validAgentTypes.includes('appointment_booking') && session.agent_type !== 'appointment_booking') {
          currentAgentType = 'appointment_booking';
        } else {
          currentAgentType = session.agent_type;
        }
      } else {
        const { data: history } = await supabase.from('messages').select('*').eq('session_id', session.id).order('created_at', { ascending: false }).limit(10);
        const lastAgentMsg = (history || []).find(m => m.role === 'agent');
        const isBookingFlow = lastAgentMsg && /what\s+(service|date|time|would you like|works for you|your\s+(full\s+)?name|email)/i.test(lastAgentMsg.content);
        const isSalesFlow = lastAgentMsg && /what\s+(would you like|do you think|can i get|would you like to order)/i.test(lastAgentMsg.content);
        
        if (isBookingFlow && validAgentTypes.includes('appointment_booking')) {
          currentAgentType = 'appointment_booking';
        } else if (isSalesFlow && validAgentTypes.includes('sales')) {
          currentAgentType = 'sales';
        } else {
          const routeResult = isAffirmation ? { agent: session.agent_type, intent: 'general', urgency: 'low', entities: {} } : await routeIntent(sanitizedMessage, history || []);
          currentAgentType = routeResult.agent;
          if (!validAgentTypes.includes(currentAgentType)) currentAgentType = session.agent_type;
        }
      }
    } else {
      const { data: history } = await supabase.from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(10);

      const lastAgentMsg = (history || []).find(m => m.role === 'agent');
      const isBookingFlow = lastAgentMsg && /what\s+(service|date|time|would you like|works for you|your\s+(full\s+)?name|email)/i.test(lastAgentMsg.content);
      const isSalesFlow = lastAgentMsg && /what\s+(would you like|do you think|can i get|would you like to order)/i.test(lastAgentMsg.content);

      if (isBookingFlow && validAgentTypes.includes('appointment_booking')) {
        currentAgentType = 'appointment_booking';
      } else if (isSalesFlow && validAgentTypes.includes('sales')) {
        currentAgentType = 'sales';
      } else {
        const routeResult = isAffirmation && session.agent_type
          ? { agent: session.agent_type, intent: 'general', urgency: 'low', entities: {} }
          : await routeIntent(sanitizedMessage, history || []);
        currentAgentType = routeResult.agent;
        if (!validAgentTypes.includes(currentAgentType)) {
          currentAgentType = (session.agent_type && validAgentTypes.includes(session.agent_type))
            ? session.agent_type
            : allAgents[0].agent_type;
        }
      }
    }

    // Update session agent_type if it changed
    if (currentAgentType !== session.agent_type) {
      session.agent_type = currentAgentType
    }

    const workspace_name = session.workspaces.name;
    let finalResponse = "";
    let handoffRequested = false;
    let handoffContext = "";
    let kbToolUsed = false;
    let bookingToolCalled = false;
    let lastAppointment: any = null;

    // Build booking context from session metadata
    let bookingContext = "";
    let bookingData: any = {};
    if (currentAgentType === 'appointment_booking') {
      try {
        const raw = session.booking_data;
        if (typeof raw === 'string') {
          bookingData = raw ? JSON.parse(raw) : {};
        } else if (raw && typeof raw === 'object') {
          bookingData = { ...raw };
        }
      } catch {
        bookingData = {};
      }
      const lowerMsg = sanitizedMessage.toLowerCase().trim();
      const skipMsgs = ['hii','hi','hello','hey','book appointment','book','appointment','hey there','good morning','good evening'];
      
      let extracted = { service: false, date: false, time: false, name: false, email: false };
      
      if (!bookingData.service && !skipMsgs.includes(lowerMsg)) {
        bookingData.service = sanitizedMessage;
        extracted.service = true;
      }
      if (!bookingData.date && !bookingData.time) {
        const hasDate = /\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2}|\d{4}[\/\-]\d{2}[\/\-]\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(lowerMsg);
        const hasTime = /\b(\d{1,2}\s*(am|pm)|morning|afternoon|evening|noon|night)\b/i.test(lowerMsg);
        if (hasDate || hasTime) {
          if (hasDate) {
            const dm = lowerMsg.match(/\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d{1,2}|\d{4}[\/\-]\d{2}[\/\-]\d{2}|jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\b/i);
            if (dm) bookingData.date = dm[0];
          }
          if (hasTime) {
            const tm = lowerMsg.match(/\b(\d{1,2}\s*(?:am|pm)|morning|afternoon|evening|noon|night)\b/i);
            if (tm) bookingData.time = tm[0];
          }
          if (!bookingData.date && !bookingData.time) bookingData.date = sanitizedMessage;
          extracted.date = true;
          extracted.time = true;
        }
      }
      if (!bookingData.name && !extracted.service && !extracted.date && !extracted.time && !/\S+@\S+\.\S+/.test(sanitizedMessage)) {
        if (sanitizedMessage.length >= 2 && sanitizedMessage.length <= 40 && !/\b(book|appointment|service|date|time|tomorrow|today|yes|no|confirm|ok|okay)\b/i.test(lowerMsg)) {
          bookingData.name = sanitizedMessage;
          extracted.name = true;
        }
      }
      if (!bookingData.email && /\S+@\S+\.\S+/.test(sanitizedMessage)) {
        bookingData.email = sanitizedMessage;
        extracted.email = true;
      }
      
      await supabase.from('conversation_sessions').update({ booking_data: bookingData }).eq('id', session.id);
      
      const parts: string[] = [];
      if (bookingData.service) parts.push(`Service: ${bookingData.service}`);
      if (bookingData.date) parts.push(`Date: ${bookingData.date}`);
      if (bookingData.time) parts.push(`Time: ${bookingData.time}`);
      if (bookingData.name) parts.push(`Name: ${bookingData.name}`);
      if (bookingData.email) parts.push(`Email: ${bookingData.email}`);
      if (parts.length > 0) bookingContext = `\n\nCOLLECTED BOOKING DETAILS:\n${parts.join('\n')}\n\nUse these EXACT values when summarizing or booking.`;
    }

    // 4. Multi-Agent LLM Loop (handoff-aware)
    let handoffCount = 0;
    const MAX_HANDOFFS = 2;

    do {
      handoffRequested = false;

      // Load current agent persona
      const currentAgent = allAgents.find(a => a.agent_type === currentAgentType);
      const config = currentAgent?.config || {};

      // Build team-aware system prompt
      const systemPrompt = buildTeamPrompt(allAgents, workspace_name, currentAgentType, channel);

      // Build message history
      const { data: msgHistory } = await supabase.from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(15);

      const messages: any[] = [
        { role: "system", content: systemPrompt + bookingContext }
      ];

      if (handoffContext) {
        messages.push({
          role: "system",
          content: `[HANDOFF CONTEXT] ${currentAgentType} is now handling the conversation. Previous teammate handed off with this context: ${handoffContext}`
        });
      }

      // Add conversation history
      const sortedHistory = (msgHistory || []).reverse();
      for (const m of sortedHistory) {
        messages.push({
          role: m.role === 'agent' ? 'assistant' : 'user',
          content: m.content
        });
      }

      // Add current user message if not already in history
      const lastMsg = sortedHistory[sortedHistory.length - 1];
      if (!lastMsg || lastMsg.content !== sanitizedMessage || lastMsg.role !== 'user') {
        messages.push({ role: "user", content: sanitizedMessage });
      }

      // 5. Tool-calling loop
      let toolLoopResponse = "";
      let toolCalls: any[] = [];
      let loopCount = 0;
      const allowedTools = getAgentTools(currentAgentType, allAgents);
      const agentTools = TOOL_DEFINITIONS.filter(t => allowedTools.includes(t.function.name));

      // Removed: menu short-circuit that bypassed LLM tool loop.
      // Menu queries now go through the LLM which will call send_menu_media and/or search_menu as instructed.
      while (loopCount < 3) {
        await updateSessionState(supabase, session.id, { typing_status: 'thinking' });

        const llmResponse = await callAgentModel({
          messages,
          tools: agentTools,
          tool_choice: "auto"
        });

        const choice = llmResponse.choices[0].message;

        if (!is_test) {
          const tokensUsed = llmResponse.usage?.total_tokens || 0;
          await checkTokenBudget(supabase, session.id, tokensUsed);
        }
        
        if (choice.tool_calls && choice.tool_calls.length > 0) {
          messages.push(choice);
          
          for (const call of choice.tool_calls) {
            const toolName = call.function.name;
            const toolArgs = JSON.parse(call.function.arguments);
            
            await updateSessionState(supabase, session.id, { typing_status: 'executing_tool' });

            if (!allowedTools.includes(toolName)) {
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                name: toolName,
                content: JSON.stringify({ error: `Tool "${toolName}" is not available for your role. Available tools: ${allowedTools.join(", ")}` })
              });
              continue;
            }
            
            if (toolName === 'match_kb_chunks') kbToolUsed = true;
            if (toolName === 'create_appointment') {
              bookingToolCalled = true;
            }

            const toolResult = await executeTool({
              tool_name: toolName,
              args: toolArgs,
              workspace_id,
              session_id: session.id,
              supabase,
              is_test: !!is_test
            });

            // Check for handoff request
            if (toolResult?.handoff_to) {
              const targetAgent = toolResult.handoff_to;
              const validTarget = validAgentTypes.includes(targetAgent);
              
              if (validTarget && targetAgent !== currentAgentType && handoffCount < MAX_HANDOFFS) {
                handoffRequested = true;
                handoffContext = toolResult.handoff_context || toolResult.handoff_reason || '';
                
                messages.push({
                  role: "tool",
                  tool_call_id: call.id,
                  name: toolName,
                  content: JSON.stringify({
                    status: 'handoff_initiated',
                    message: `Handing off to ${targetAgent}`
                  })
                });

                // Add a handoff note for the LLM
                messages.push({
                  role: "assistant",
                  content: `I'll transfer you to my teammate who handles ${AGENT_DESCRIPTIONS[targetAgent]?.label || targetAgent}. Give me just a moment!`
                });

                finalResponse = `Let me transfer you to our ${AGENT_DESCRIPTIONS[targetAgent]?.label || 'specialist'} who can help with this. One moment please!`;
                currentAgentType = targetAgent;
                handoffCount++;
                
                // Update session with new agent_type
                await supabase.from('conversation_sessions')
                  .update({ agent_type: targetAgent, updated_at: new Date().toISOString() })
                  .eq('id', session.id);

                break;  // Exit tool loop to restart with new agent
              } else {
                // Invalid or too many handoffs, treat as normal tool result
                messages.push({
                  role: "tool",
                  tool_call_id: call.id,
                  name: toolName,
                  content: JSON.stringify({ error: "Cannot handoff - unavailable or max transfers reached" })
                });
              }
            } else {
              if (toolName === 'create_appointment' && toolResult?.id) {
                lastAppointment = toolResult;
              }
              messages.push({
                role: "tool",
                tool_call_id: call.id,
                name: toolName,
                content: JSON.stringify(toolResult)
              });
            }
          }

          if (handoffRequested) break;  // Break out of tool loop to restart agent loop
          loopCount++;
        } else {
          toolLoopResponse = sanitizeLlmOutput(choice.content);
          break;
        }
      }

      if (!handoffRequested) {
        finalResponse = toolLoopResponse || guardrailConfig.fallback_message;
      }

    } while (handoffRequested && handoffCount <= MAX_HANDOFFS);

    if (!finalResponse) finalResponse = guardrailConfig.fallback_message;

    // Format confirmation message if create_appointment succeeded
    if (lastAppointment) {
      const apptDate = formatIST(lastAppointment.start_at);
      let confirmMsg = `Your appointment is confirmed! ✅\n\n• Service: ${lastAppointment.service}\n• Date: ${apptDate}`;
      if (lastAppointment.customer_name) confirmMsg += `\n• Name: ${lastAppointment.customer_name}`;
      if (lastAppointment.meeting_link) confirmMsg += `\n• Google Meet: ${lastAppointment.meeting_link}`;
      finalResponse = confirmMsg;
    }

    // Enforce max_response_length
    const maxLen = guardrailConfig.max_response_length || 800;
    if (finalResponse.length > maxLen) {
      const truncated = finalResponse.slice(0, maxLen);
      const lastSentence = truncated.lastIndexOf('. ');
      const lastPeriod = truncated.lastIndexOf('.');
      const lastNewline = truncated.lastIndexOf('\n');
      const breakAt = Math.max(lastSentence, lastPeriod, lastNewline);
      finalResponse = breakAt > maxLen * 0.5 ? truncated.slice(0, breakAt + 1).trim() : truncated.trim() + '...';
    }

    // 5.5 Inline JSON tool fallback (catches LLM text+JSON output when tool calling fails)
    const jsonToolMatch = finalResponse.match(/\{[\s\S]*"(\w+)"[\s\S]*\}/);
    if (jsonToolMatch) {
      try {
        const parsed = JSON.parse(jsonToolMatch[0]);
        const toolSignatures: Record<string, string[]> = {
          check_availability: ["date", "time"],
          create_appointment: ["name", "service", "date", "time"],
          request_handoff: ["target_agent", "reason"],
          update_appointment: ["appointment_id"],
          cancel_appointment: ["appointment_id"],
          capture_lead: ["name"],
          update_contact: ["name"],
          match_kb_chunks: ["query"],
          search_menu: ["query"],
          send_menu_media: ["caption"],
          create_order: ["items"],
          confirm_payment: ["order_id"],
          get_order_status: ["order_id"],
        };
        let matchedTool: string | null = null;
        let bestScore = 0;
        for (const [tool, reqKeys] of Object.entries(toolSignatures)) {
          const score = reqKeys.filter(k => k in parsed).length;
          if (score > bestScore) { bestScore = score; matchedTool = tool; }
        }
            if (matchedTool) {
              const allowedTools = getAgentTools(currentAgentType, allAgents || []);
              if (allowedTools.includes(matchedTool)) {
                finalResponse = finalResponse.replace(jsonToolMatch[0], '').replace(/\s+,?\s*$/, '') || 'One moment please...';
                const toolResult = await executeTool({ tool_name: matchedTool, args: parsed, workspace_id, session_id: session.id, supabase, is_test: !!is_test });
                if (matchedTool === 'create_appointment') {
                  bookingToolCalled = true;
                  if (toolResult?.id) lastAppointment = toolResult;
                }

            if (matchedTool === 'request_handoff' && toolResult?.handoff_to && toolResult.handoff_to !== currentAgentType) {
              currentAgentType = toolResult.handoff_to;
              handoffCount++;
              await supabase.from('conversation_sessions').update({ agent_type: toolResult.handoff_to, updated_at: new Date().toISOString() }).eq('id', session.id);
              messages.push({ role: "assistant", content: finalResponse });
              messages.push({ role: "tool", tool_call_id: "inline", name: matchedTool, content: JSON.stringify(toolResult) });

              const currentAgent = allAgents?.find(a => a.agent_type === currentAgentType);
              const config = currentAgent?.config || {};
              const handoffPrompt = buildTeamPrompt(allAgents, workspace_name, currentAgentType, channel);
              messages.unshift({ role: "system", content: handoffPrompt });
              const handoffMessages = messages.filter(m => m.role !== 'system' || m === messages[0]);
              const handoffPayload = { messages: handoffMessages.concat({ role: "user", content: `[Handoff from previous teammate] ${toolResult.handoff_context || ''}. Continue assisting the customer.` }) };
              const handoffLlm = await callAgentModel(handoffPayload);
              finalResponse = sanitizeLlmOutput(handoffLlm.choices?.[0]?.message?.content || guardrailConfig.fallback_message);
            } else if (!toolResult?.error) {
              messages.push({ role: "assistant", content: finalResponse });
              messages.push({ role: "tool", tool_call_id: "inline", name: matchedTool, content: JSON.stringify(toolResult) });
              const rePromptPayload = { messages: messages.concat({ role: "user", content: `Based on the tool result above, respond to the customer naturally. Keep it brief.` }) };
              const rePromptLlm = await callAgentModel(rePromptPayload);
              finalResponse = sanitizeLlmOutput(rePromptLlm.choices?.[0]?.message?.content || finalResponse);
            }
          }
        }
      } catch (_) {}
    }

    // 5.6 Cache KB-generated responses
    if (!is_test && cacheKeyHex && kbToolUsed && finalResponse !== guardrailConfig.fallback_message) {
      try { await supabase.from('kb_response_cache').upsert({
        workspace_id, cache_key: cacheKeyHex, agent_hash: agentHash, query_text: sanitizedMessage, response_text: finalResponse
      }, { onConflict: 'workspace_id, cache_key, agent_hash' }); } catch (_) {}
    }

    // 5.7 Booking confirmation pattern detector
    // Catches LLM claiming "I've booked your appointment" without calling create_appointment
    if (!is_test && currentAgentType === 'appointment_booking' && !bookingToolCalled) {
      const bookingPatterns = /\b(booked|booking|scheduled|confirmed|set up|reserved)\b/i;
      if (bookingPatterns.test(finalResponse) && !/unable|cannot|can't|sorry/i.test(finalResponse)) {
        try {
          const { data: msgHistory } = await supabase.from('messages')
            .select('content, role')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          const convoText = (msgHistory || []).map(m =>
            `${m.role === 'agent' ? 'AI' : 'Customer'}: ${m.content}`
          ).join('\n');

          const extractResult = await callAgentModel({
            messages: [
              { role: "system", content: "Extract booking details from this conversation. Return ONLY a JSON object with these fields (use null for missing): name, phone, email, service, date, time. No other text." },
              { role: "user", content: convoText }
            ]
          });

          const extractedText = extractResult.choices?.[0]?.message?.content || '';
          const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const bookingDetails = JSON.parse(jsonMatch[0]);
            if (!bookingDetails.service) bookingDetails.service = 'General';

            const apptResult = await executeTool({
              tool_name: 'create_appointment',
              args: bookingDetails,
              workspace_id,
              session_id: session.id,
              supabase
            });

            if (apptResult && !apptResult.error) {
              lastAppointment = apptResult;
              const dateStr = apptResult.start_at ? formatIST(apptResult.start_at) : '';
              finalResponse = `Your appointment is confirmed! ✅\n\n• Service: ${apptResult.service || 'General'}\n• Date: ${dateStr}`;
              if (apptResult.customer_name) finalResponse += `\n• Name: ${apptResult.customer_name}`;
              if (apptResult.meeting_link) finalResponse += `\n• Google Meet: ${apptResult.meeting_link}`;
              bookingToolCalled = true;
            }
          }
        } catch (_) {
          console.warn('[ORCHESTRATOR] Booking pattern detection failed (non-fatal)');
        }
      }
    }

    // 5.8 KB fallback for customer_support
    if (!is_test && currentAgentType === 'customer_support' && !kbToolUsed) {
      try {
        const kbResult = await executeTool({
          tool_name: 'match_kb_chunks',
          args: { query: sanitizedMessage },
          workspace_id,
          session_id: session.id,
          supabase
        });
        if (kbResult?.kb_chunks?.length > 0) {
          const kbPrompt = [
            { role: "system", content: "Answer the customer's question based on the knowledge base information below. Keep it brief and natural." },
            { role: "user", content: `Customer question: ${sanitizedMessage}\n\nKnowledge base:\n${kbResult.kb_chunks.map((c: any) => c.content).join('\n')}` }
          ];
          const kbResponse = await callAgentModel({ messages: kbPrompt, tool_choice: "none" });
          const kbText = kbResponse.choices?.[0]?.message?.content;
          if (kbText) {
            finalResponse = sanitizeLlmOutput(kbText);
            kbToolUsed = true;
          }
        }
      } catch (_) {
        console.warn('[ORCHESTRATOR] KB fallback failed (non-fatal)');
      }
    }

    // 5.9 Lead capture fallback for sales
    if (!is_test && currentAgentType === 'sales') {
      const leadPattern = /\b(name|email|phone|interested|want|need|buy|price|quote|pricing|cost|rate)\b/i;
      if (leadPattern.test(sanitizedMessage)) {
        try {
          const extractResult = await callAgentModel({
            messages: [
              { role: "system", content: "Extract lead details from this customer message. Return ONLY a JSON object with these fields (use null for missing): name, phone, email, interest. No other text." },
              { role: "user", content: sanitizedMessage }
            ]
          });
          const extracted = extractResult.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
          if (extracted) {
            const leadDetails = JSON.parse(extracted[0]);
            if (leadDetails.name || leadDetails.phone || leadDetails.email) {
              await executeTool({
                tool_name: 'capture_lead',
                args: leadDetails,
                workspace_id,
                session_id: session.id,
                supabase
              });
            }
          }
        } catch (_) {
          console.warn('[ORCHESTRATOR] Lead capture fallback failed (non-fatal)');
        }
      }
    }

    // 6. Store Final Response
    await supabase.from('messages').insert({
        workspace_id, session_id: session.id, content: finalResponse, direction: 'outbound', role: 'agent', agent_type: currentAgentType,
        metadata: { trace_id: traceId, handoff_count: handoffCount }
    });

    // 7. GoWA Dispatch
    await dispatchToGoWA(supabase, workspace_id!, customer_jid!, channel!, is_test ?? false, session.id, finalResponse);

    // 8. Update Session State (persist routed agent_type)
    await updateSessionState(supabase, session.id, { 
        last_message_at: new Date().toISOString(),
        last_message_preview: finalResponse.substring(0, 100),
        typing_status: 'idle',
        agent_type: currentAgentType
    });

    // 8b. Deduct credits (only for non-test sessions)
    if (!is_test) {
      try {
        await supabase.rpc('decrement_credits', {
          p_workspace_id: workspace_id,
          p_credits: CREDITS_PER_MESSAGE,
          p_session_id: session.id
        });
      } catch (creditError) {
        console.error(`[ORCHESTRATOR] Credit deduction failed: ${creditError}`);
      }
    }

    return new Response(JSON.stringify({ response_parts: [finalResponse], metadata: { handoff_count: handoffCount, agent_type: currentAgentType, booking_data: bookingData } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error(`[ORCHESTRATOR] Global Error: ${error.message}`);

    // Persist fallback message + reset session state even on error
    if (session && workspace_id) {
      try {
        await supabase.from('messages').insert({
          workspace_id,
          session_id: session.id,
          content: STATIC_FALLBACK_MESSAGE,
          direction: 'outbound',
          role: 'agent',
          metadata: { trace_id: traceId, error: error.message }
        });
      } catch (_) {}

      try { await updateSessionState(supabase, session.id, { typing_status: 'idle' }); } catch (_) {}

      // Attempt GoWA dispatch for the fallback message
      if (channel === 'whatsapp' && !is_test && customer_jid) {
        try {
          const { data: gs } = await supabase.from('gowa_sessions').select('gowa_session_id').eq('workspace_id', workspace_id).maybeSingle();
          const deviceId = gs?.gowa_session_id;
          if (deviceId) {
            const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, "");
            const gowaKey = Deno.env.get('GOWA_API_KEY');
            const auth = btoa(gowaKey || '');
            const phone = customer_jid.split('@')[0];
            await fetch(`${gowaBase}/send/message`, {
              method: 'POST',
              headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
              body: JSON.stringify({ phone, message: STATIC_FALLBACK_MESSAGE })
            });
          }
        } catch (_) {}
      }
    }

    return new Response(JSON.stringify({ response_parts: [STATIC_FALLBACK_MESSAGE], metadata: { error: error.message, trace_id: traceId } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
