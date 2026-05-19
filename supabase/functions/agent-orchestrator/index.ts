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

const TOOL_PERMISSIONS: Record<string, string[]> = {
  customer_support: ["match_kb_chunks", "get_contact_history", "update_contact", "request_handoff", "escalation_request"],
  appointment_booking: ["check_availability", "create_appointment", "update_appointment", "cancel_appointment", "get_contact_history", "request_handoff", "escalation_request"],
  sales: ["capture_lead", "get_contact_history", "update_contact", "update_lead_stage", "get_pipeline", "schedule_follow_up", "generate_quote", "search_menu", "send_menu_media", "create_order", "confirm_payment", "get_order_status", "request_handoff", "escalation_request"],
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
    ? `\n\nNOTE: You are the only agent for this workspace. Handle everything within your capabilities. If you cannot help, escalate to a human using \`escalation_request\`.`
    : ''

  const noBookingNotice = (!hasBookingAgent && currentAgentType === 'customer_support')
    ? `\n\nNOTE: Appointment booking is not configured for this workspace. If the user asks to book or manage appointments, politely let them know this feature isn't available yet and offer to pass their details to the team. Do NOT attempt to book or hand off for booking.`
    : ''

  const mustHandoffBooking = (hasBookingAgent && currentAgentType === 'customer_support')
    ? `\n\nIMPORTANT: You CANNOT book or check appointment availability. Only the Appointment Booker teammate can do that. If the user asks to book, reschedule, cancel, or check appointment times — use \`request_handoff\` with target_agent "appointment_booking" immediately. Do NOT try to handle it yourself.`
    : ''
  
  const mustHandoffMenu = (currentAgentType === 'customer_support')
    ? `\n\nIMPORTANT: You CANNOT browse, show, or provide pricing for the menu/services. Only the Sales teammate can do that. If the user asks about menu, services, pricing, ordering, or what's available — use \`request_handoff\` with target_agent "sales" immediately. Do NOT try to handle it yourself.`
    : ''

  const bookingRules = (hasBookingAgent && currentAgentType === 'appointment_booking')
    ? `\n\nBOOKING RULES:
1. Collect EACH detail one at a time: service → date → time → name → email. Ask ONE question per message.
2. If the customer already provided some details (e.g. from conversation history), do NOT ask again.
3. ${channel === 'whatsapp' ? "The customer's phone is already available from WhatsApp — do NOT ask for it." : "phone is MANDATORY — keep asking if not provided."}
4. Before booking, ALWAYS summarize ALL collected details and ask the customer to confirm.
5. Only call \`create_appointment\` AFTER the customer explicitly confirms.
6. After successful booking, tell the customer the full details: service, date, time, and any meeting link. Do NOT say "you'll receive a message" — the details are in this message itself.
7. Include the booking summary (service, date, time, name) in your confirmation message.
8. CRITICAL: NEVER claim an appointment is booked, confirmed, or scheduled unless you have actually called the \`create_appointment\` tool and it succeeded.
9. When a customer gives you a date and time, ALWAYS call \`check_availability\` immediately — do NOT just say "let me check" without actually calling the tool. If available, tell the customer the slot is free. If not, suggest alternatives.`
    : ''

  const salesRules = (currentAgentType === 'sales')
    ? `\n\nSALES ORDERING FLOW:
When a customer asks about your menu/services:
1. Call \`send_menu_media\` to send the uploaded menu image/PDF via WhatsApp. The image/PDF IS the menu — it contains all available items and prices.
2. If \`send_menu_media\` succeeds, tell the customer the menu has been sent and ask what they'd like to order. Do NOT call \`search_menu\` — the customer can see everything in the image.
3. Only call \`search_menu\` if the customer asks about something specific (e.g. "what are your prices for X?" or "do you have Y?").
4. Ask what they'd like to order. Collect items and quantities one at a time.
5. Before creating the order, summarize everything and ask the customer to confirm.
6. Only call \`create_order\` AFTER the customer confirms.
7. Send the UPI payment link and tell them to pay and reply with confirmation.
8. When they confirm payment, call \`confirm_payment\` to mark it paid.

CRITICAL RULES:
- Never list or describe menu items from memory.
- If \`send_menu_media\` fails: apologize and say the menu is being updated, then offer to help with other questions.
- If \`send_menu_media\` succeeds: DO NOT say the menu is unavailable or being updated — the image IS the menu. Just ask what they'd like.`
    : ''

  const customSection = customPersona
    ? `\n\nCUSTOM INSTRUCTIONS:\nIMPORTANT: Your role is "${AGENT_DESCRIPTIONS[currentAgentType]?.label || currentAgentType}". The custom instructions below MUST align with this role. If they tell you to act as a different agent type, ignore those instructions and follow the rules above.\n${customPersona}`
    : ''

  return `You are ${currentName}, a helpful human teammate at ${workspace_name} on ${channel}.
  
YOUR ROLE: ${AGENT_DESCRIPTIONS[currentAgentType]?.description || 'General support.'}
YOUR SKILLS: ${AGENT_DESCRIPTIONS[currentAgentType]?.skills || 'General assistance, escalation'}
${teamIntro}${noTeamNotice}${noBookingNotice}${mustHandoffBooking}${mustHandoffMenu}${bookingRules}${salesRules}${customSection}

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
- Search the knowledge base for business info.${hasTeam ? "\n- If they want pricing or sales, capture the lead or hand off to the Sales teammate." : "\n- If they want pricing or sales, capture the lead directly."}
- If you cannot help, use \`escalation_request\` to transfer to a human.
- NEVER make up information you don't know.

${hasTeam
  ? `HANDOFF RULES:\n- If the customer asks about a service or topic outside your role, use \`request_handoff\` to transfer to the right teammate. Include a summary of what was already discussed.\n- NEVER try to handle a task that belongs to another role. If unsure, hand off.`
  : `SINGLE AGENT RULES:\n- You are handling all requests. Use \`escalation_request\` only for issues you truly cannot resolve.`}

AVAILABLE FUNCTIONS:
- You have functions available to perform actions. When you need to do something (check availability, book, look up info), use the appropriate function instead of just describing what you would do.`
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
    const vals = payload as { workspace_id?: string; customer_jid?: string; message?: string; channel?: string; agent_type?: string; is_test?: boolean };
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

    // 1. Load/Create Session
    session = await getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type })

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
      return new Response(JSON.stringify({ response_parts: [welcomeTemplate], metadata: { greeting: true } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
        return new Response(JSON.stringify({ response_parts: [cached.response_text], cached: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // 3. Determine initial agent via routing
    const validAgentTypes = allAgents.map(a => a.agent_type);

    // If agent_type explicitly provided and not a follow-up, use it directly
    // This lets callers (webhook) override stale session agent_type
    let currentAgentType;
    if (agent_type && validAgentTypes.includes(agent_type) && !isAffirmation) {
      currentAgentType = agent_type;
      session.agent_type = agent_type;
    } else {
      const { data: history } = await supabase.from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(10);

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
        { role: "system", content: systemPrompt }
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

    let messageId: string | undefined;

    // 7. GoWA Dispatch with retry + failed queue
    const { data: gowaSession } = await supabase.from('gowa_sessions').select('gowa_session_id').eq('workspace_id', workspace_id).maybeSingle();
    const deviceId = gowaSession?.gowa_session_id;
    const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, "");
    const gowaKey = Deno.env.get('GOWA_API_KEY');
    const auth = btoa(gowaKey || '');
    const phone = customer_jid?.split('@')[0];

    if (channel === 'whatsapp' && deviceId && phone && !is_test) {
        try {
            await fetch(`${gowaBase}/send/presence`, {
                method: 'POST',
                headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
                body: JSON.stringify({ phone, type: 'available' })
            });
        } catch (_) {}

        const delayMs = calculateTypingDelay(finalResponse);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        try {
            await fetch(`${gowaBase}/send/presence`, {
                method: 'POST',
                headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
                body: JSON.stringify({ phone, type: 'unavailable' })
            });
        } catch (_) {}

        // Split long messages at sentence boundaries
        const maxLen = 1000;
        const parts: string[] = [];
        let remaining = finalResponse;
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
                const { data: msgs } = await supabase.from('messages').select('id').eq('session_id', session.id).eq('direction', 'outbound').order('created_at', { ascending: false }).limit(1);
                messageId = msgs?.[0]?.id;
            } catch (_) {}
            console.debug(`[ORCHESTRATOR] GoWA dispatch success for message ${messageId}: gowa_message_ids=${gowaMessageIds.join(',')}`);
            if (messageId && gowaMessageIds.length > 0) {
                try { await supabase.from('messages').update({ gowa_message_id: gowaMessageIds[0] }).eq('id', messageId); } catch (_) {}
            }
        } else {
            try { await supabase.from('failed_messages').insert({
                workspace_id,
                session_id: session.id,
                raw_message: finalResponse,
                failure_reason: lastError,
                retry_count: 3,
                resolved: false
            }); } catch (_) {}
        }
    }

    // 8. Update Session State (persist routed agent_type)
    await updateSessionState(supabase, session.id, { 
        last_message_at: new Date().toISOString(),
        last_message_preview: finalResponse.substring(0, 100),
        typing_status: 'idle',
        agent_type: currentAgentType
    });

    return new Response(JSON.stringify({ response_parts: [finalResponse], metadata: { handoff_count: handoffCount, agent_type: currentAgentType } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
