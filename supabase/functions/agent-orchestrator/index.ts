import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { executeTool } from "./lib/tools.ts"
import { getOrCreateSession, updateSessionState } from "./lib/session.ts"
import { callAgentModel, STATIC_FALLBACK_MESSAGE } from "./lib/llm.ts"
import { checkWhatsAppWindow, calculateTypingDelay, logWindowExpired } from "./lib/compliance.ts"
import { TOOL_DEFINITIONS } from "./lib/tool-definitions.ts"
import { sanitizeUserInput, sanitizeLlmOutput, checkTokenBudget } from "./lib/sanitize.ts"
import { routeIntent } from "./lib/router.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOOL_PERMISSIONS: Record<string, string[]> = {
  customer_support: ["match_kb_chunks", "get_contact_history", "update_contact", "request_handoff", "escalation_request"],
  appointment_booking: ["check_availability", "create_appointment", "update_appointment", "cancel_appointment", "get_contact_history", "request_handoff", "escalation_request"],
  sales: ["capture_lead", "match_kb_chunks", "get_contact_history", "update_contact", "request_handoff", "escalation_request"],
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
    description: "Handles pricing inquiries, lead capture, and qualification.",
    skills: "lead capture, pricing info, qualification questions"
  }
}

function buildTeamPrompt(agents: any[], workspace_name: string, currentAgentType: string, channel: string): string {
  const current = agents.find(a => a.agent_type === currentAgentType)
  const currentName = current?.config?.agent_name || AGENT_DESCRIPTIONS[currentAgentType]?.label || "Teammate"

  const teamList = agents
    .filter(a => a.agent_type !== currentAgentType)
    .map(a => {
      const name = a.config?.agent_name || AGENT_DESCRIPTIONS[a.agent_type]?.label || a.agent_type
      const desc = AGENT_DESCRIPTIONS[a.agent_type]
      return `  - ${name} (${a.agent_type}): ${desc?.description || ''} | Skills: ${desc?.skills || ''}`
    })
    .join('\n')

  const teamIntro = teamList
    ? `\n\nYOUR TEAMMATES (available for handoff):\n${teamList}\n\nIf the user asks about something outside your expertise, use \`request_handoff\` to transfer them to the right teammate. Summarize what you've already discussed so the next teammate can pick up seamlessly.`
    : ''

  const hasBookingAgent = agents.some(a => a.agent_type === 'appointment_booking')

  const noBookingNotice = (!hasBookingAgent && currentAgentType === 'customer_support')
    ? `\n\nNOTE: Appointment booking is not configured for this workspace. If the user asks to book or manage appointments, politely let them know this feature isn't available yet and offer to pass their details to the team. Do NOT attempt to book or hand off for booking.`
    : ''

  const bookingRules = (hasBookingAgent && currentAgentType === 'appointment_booking')
    ? `\n\nBOOKING RULES:
1. Collect name, phone, email, service, date, and time from the customer.
2. Before booking, ALWAYS summarize the details and ask the customer to confirm.
3. Only call \`create_appointment\` AFTER the customer explicitly confirms.
4. Once confirmed, the system will automatically send a WhatsApp message and email with the meeting link — tell the customer to check their messages.`
    : ''

  return `You are ${currentName}, a helpful human teammate at ${workspace_name} on ${channel}.
  
YOUR ROLE: ${AGENT_DESCRIPTIONS[currentAgentType]?.description || 'General support.'}
YOUR SKILLS: ${AGENT_DESCRIPTIONS[currentAgentType]?.skills || 'General assistance, escalation'}
${teamIntro}${noBookingNotice}${bookingRules}

IDENTITY RULES:
1. NEVER reveal you are an AI.
2. If asked identity, say: "I'm ${currentName} from ${workspace_name}."
3. Be warm, professional, and concise.

GUIDELINES:
- Search the knowledge base for business info.
- If they want pricing or sales, capture the lead or hand off to the Sales teammate.
- If you cannot help, use \`request_handoff\` to transfer to the right teammate.
- NEVER make up information you don't know.

HANDOFF RULES:
- If the customer asks about a service or topic outside your role, use \`request_handoff\` to transfer to the right teammate. Include a summary of what was already discussed.
- NEVER try to handle a task that belongs to another role. If unsure, hand off.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const startTime = Date.now();
  const traceId = crypto.randomUUID();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    let { workspace_id, customer_jid, message, channel, agent_type, is_test } = payload

    // Auto-generate customer_jid for webchat if missing
    if (!customer_jid && channel === 'webchat') {
      customer_jid = crypto.randomUUID();
    }

    console.log(`[ORCHESTRATOR] Received request for workspace: ${workspace_id}, channel: ${channel}`);

    // Sanitize user input
    const sanitizedMessage = sanitizeUserInput(message);

    // 1. Load/Create Session
    const session = await getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type })

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

    // 1.5 KB Response Cache Check
    let cacheKeyHex = "";
    {
      const msgBytes = new TextEncoder().encode(sanitizedMessage.toLowerCase().trim().slice(0, 500));
      const hashBuf = await crypto.subtle.digest('SHA-256', msgBytes);
      cacheKeyHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: cached } = await supabase.from('kb_response_cache')
        .select('response_text, access_count, id')
        .eq('workspace_id', workspace_id)
        .eq('cache_key', cacheKeyHex)
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

    // 2. Load ALL Active Agents
    const { data: allAgents } = await supabase.from('workspace_agents')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('status', 'active');

    if (!allAgents || allAgents.length === 0) {
      return new Response(JSON.stringify({ 
        response_parts: [guardrailConfig.fallback_message]
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Determine initial agent via routing
    const { data: history } = await supabase.from('messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(10);

    const routeResult = await routeIntent(sanitizedMessage, history || []);
    const validAgentTypes = allAgents.map(a => a.agent_type);
    let currentAgentType = validAgentTypes.includes(routeResult.agent) ? routeResult.agent : allAgents[0].agent_type;

    // Update session agent_type if it changed
    if (currentAgentType !== session.agent_type) {
      session.agent_type = currentAgentType
    }

    const workspace_name = session.workspaces.name;
    let finalResponse = "";
    let handoffRequested = false;
    let handoffContext = "";
    let kbToolUsed = false;

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

      while (loopCount < 3) {
        await updateSessionState(supabase, session.id, { typing_status: 'thinking' });
        
        const llmResponse = await callAgentModel({
          messages,
          tools: TOOL_DEFINITIONS,
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

            const allowedTools = TOOL_PERMISSIONS[currentAgentType] || [];
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

            const toolResult = await executeTool({
              tool_name: toolName,
              args: toolArgs,
              workspace_id,
              session_id: session.id,
              supabase
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

    // 5.5 Cache KB-generated responses
    if (!is_test && cacheKeyHex && kbToolUsed && finalResponse !== guardrailConfig.fallback_message) {
      try { await supabase.from('kb_response_cache').upsert({
        workspace_id, cache_key: cacheKeyHex, query_text: sanitizedMessage, response_text: finalResponse
      }, { onConflict: 'workspace_id, cache_key' }); } catch (_) {}
    }

    // 6. Store Final Response
    await supabase.from('messages').insert({
        workspace_id, session_id: session.id, content: finalResponse, direction: 'outbound', role: 'agent', agent_type: currentAgentType,
        metadata: { trace_id: traceId, handoff_count: handoffCount }
    });

    // 7. GoWA Dispatch with retry + failed queue
    const { data: gowaSession } = await supabase.from('gowa_sessions').select('gowa_session_id').eq('workspace_id', workspace_id).maybeSingle();
    const deviceId = gowaSession?.gowa_session_id;
    const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, "");
    const gowaKey = Deno.env.get('GOWA_API_KEY');
    const auth = btoa(gowaKey || '');
    const phone = customer_jid?.split('@')[0];

    if (channel === 'whatsapp' && deviceId && phone && !is_test) {
        // Send composing presence indicator
        try {
            await fetch(`${gowaBase}/send/presence`, {
                method: 'POST',
                headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
                body: JSON.stringify({ phone, type: 'composing' })
            });
        } catch (_) {}

        const delayMs = calculateTypingDelay(finalResponse);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Stop composing indicator
        try {
            await fetch(`${gowaBase}/send/presence`, {
                method: 'POST',
                headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
                body: JSON.stringify({ phone, type: 'paused' })
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
                    if (resp.ok) { dispatched = true; break; }
                    lastError = `HTTP ${resp.status}: ${await resp.text().catch(() => '')}`;
                } catch (err: any) {
                    lastError = err.message;
                }
                console.warn(`[ORCHESTRATOR] GoWA dispatch attempt ${attempt + 1}/3 for part failed: ${lastError}`);
            }
        }

        if (!dispatched) {
            try { await supabase.from('failed_messages').insert({
                workspace_id,
                raw_message: finalResponse,
                payload: { phone, device_id: deviceId, channel: 'whatsapp', session_id: session.id },
                error_message: lastError
            }); } catch (_) {}
        }
    }

    // 8. Update Session State
    await updateSessionState(supabase, session.id, { 
        last_message_at: new Date().toISOString(),
        last_message_preview: finalResponse.substring(0, 100),
        typing_status: 'idle'
    });

    return new Response(JSON.stringify({ response_parts: [finalResponse], metadata: { handoff_count: handoffCount } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error(`[ORCHESTRATOR] Global Error: ${error.message}`);
    return new Response(JSON.stringify({ response_parts: [STATIC_FALLBACK_MESSAGE], metadata: { error: error.message } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
