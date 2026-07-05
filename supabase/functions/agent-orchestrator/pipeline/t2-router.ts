import { PipelineContext, TierResult, QueryAnalysis, AgentPayload } from "../lib/types.ts";
import { callLLM } from "../lib/llm.ts";
import { renderTemplate, type TemplateVars } from "../lib/template-engine.ts";

const QUERY_ANALYSIS_TEMPLATE = `You are an intent classifier for {{workspaceName}}. Read the user's message and determine what they need.

Available agents:
- customer_support: Handles general business Q&A — services, hours, location, policies, support issues, account help. Answers factually from knowledge base. Also handles escalation requests (wants to speak to a human).
- appointment_booking: Manages scheduling — booking, rescheduling, cancelling, checking availability for any service. Collects details (service, date, time, name, contact info) to confirm appointments.
- sales: Handles pricing, cost inquiries, quotes, service packages, ordering/buying, lead capture. Does NOT process payments.

For each message, identify what the user wants to accomplish right now and pick the best agent. The primary agent should match the user's main need. If the user's current message starts a new topic, route to the appropriate agent for that topic regardless of conversation history.

If the message contains multiple distinct requests that need different agents, set the primary agent for the main request and list the others in sub_tasks.

Output valid JSON only, with no markdown or commentary:
{
  "agent": "customer_support" | "appointment_booking" | "sales",
  "intent": "concise description",
  "entities": { "service": "", "date": "", "time": "", "name": "", "phone": "", "email": "", "product": "" },
  "urgency": "low" | "medium" | "high",
  "wants_human": false,
  "emotional_tone": "calm" | "positive" | "frustrated" | "urgent" | "distressed",
  "sub_tasks": []
}

Example multi-intent: "I want to book a consultation and know your pricing" -> agent: "appointment_booking", sub_tasks: [{agent: "sales", intent: "check pricing"}]
Example booking follow-up: "Friday at 2pm works" with context showing booking flow -> agent: "appointment_booking"
Example cancel/rebook: User has existing booking and says "cancel it and book tomorrow 3pm" -> agent: "appointment_booking" (stays on booking for modification)
Example providing booking details: "tomorrow 3pm in person name samir" after being asked for info -> agent: "appointment_booking"
`;

function buildQueryAnalysisPrompt(vars: TemplateVars): string {
  return renderTemplate(QUERY_ANALYSIS_TEMPLATE, vars);
}

async function llmClassify(ctx: PipelineContext, activeAgents: string[], conversationContext: string): Promise<QueryAnalysis> {
  const msg = ctx.payload.message;
  const agentList = activeAgents.map(a => a.replace("_", " ")).join(", ");

  try {
    const vars = { workspaceName: ctx.workspace?.name || "a business" };
    const systemPrompt = buildQueryAnalysisPrompt(vars) + `\n\nActive agents for this workspace: ${agentList}`;
    const messages: any[] = [];
    if (conversationContext) {
      messages.push({ role: "user", content: `Previous conversation:\n${conversationContext}\n\nNew message: ${msg}` });
    } else {
      messages.push({ role: "user", content: msg });
    }

    const llmPayload: AgentPayload = {
      system: systemPrompt,
      messages,
      max_tokens: 350,
      temperature: 0.2,
    };

    const llmResponse = await callLLM(llmPayload);
    let raw = llmResponse.choices?.[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];
    const analysis = JSON.parse(raw) as QueryAnalysis;

    if (!["customer_support", "appointment_booking", "sales"].includes(analysis.agent)) {
      analysis.agent = "customer_support";
    }
    if (!activeAgents.includes(analysis.agent)) {
      analysis.agent = "customer_support";
      analysis.intent = "fallback_unavailable_agent";
    }

    return analysis;
  } catch (e: any) {
    console.error("[T2] LLM query analysis failed:", e.message);
    return {
      agent: activeAgents.includes("customer_support") ? "customer_support" : "appointment_booking",
      intent: "fallback_classification_error",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm",
    };
  }
}

export async function runT2(ctx: PipelineContext): Promise<TierResult> {
  const msg = ctx.payload.message;

  const { data: activeAgentRows } = await ctx.supabase
    .from("workspace_agents")
    .select("agent_type")
    .eq("workspace_id", ctx.session.workspace_id)
    .eq("status", "active")
    .is("deleted_at", null);
  const activeAgents = new Set(activeAgentRows?.map(a => a.agent_type) || []);

  if (ctx.payload.agent_type && ctx.payload.is_test) {
    ctx.agentType = ctx.payload.agent_type;
    ctx.routingReason = "explicit_test_agent";
    ctx._queryAnalysis = {
      agent: ctx.payload.agent_type as any,
      intent: "test_message",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm",
    };
    return { handled: false };
  }

  if (ctx.payload.source === "widget") {
    ctx.agentType = "customer_support";
    ctx.routingReason = "widget_channel";
    ctx._queryAnalysis = {
      agent: "customer_support",
      intent: "widget_message",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm",
    };
    return { handled: false };
  }

  // Build conversation context from recent messages for better classification
  let conversationContext = "";
  try {
    const { data: recent } = await ctx.supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", ctx.session.id)
      .order("created_at", { ascending: false })
      .limit(6);
    if (recent && recent.length > 0) {
      const lines = recent.reverse().map(m =>
        `${m.role === "agent" ? "Assistant" : "Customer"}: ${m.content.slice(0, 200)}`
      );
      conversationContext = lines.join("\n");
    }
  } catch (e) {
    console.error("[T2] History fetch error:", e?.message || e);
  }

  // Lightweight intent pre-check for clear booking/sales intents (LLM isn't reliable enough)
  // Runs BEFORE follow-up check so clear booking/sales intents always take priority
  const workingAgent = ctx.session?.working_context?.agent_type;
  const msgLower = msg.toLowerCase();
  const bookingKeywords = /\b(book|appointment|schedule|reschedule|cancel|rebook)\b/i.test(msgLower);
  const priceKeywords = /\b(price|cost|quote|how much|buy|order|pricing|rates|prices)\b/i.test(msgLower);
  console.log(`[T2] msg="${msgLower}" bookingMatch=${bookingKeywords} priceMatch=${priceKeywords} activeBooking=${activeAgents.has("appointment_booking")} workingAgent=${workingAgent}`)

  const hasBookingIntent = bookingKeywords;
  if (hasBookingIntent && activeAgents.has("appointment_booking")) {
    console.log("[T2] KEYWORD PRE-CHECK: routing to appointment_booking")
    ctx.agentType = "appointment_booking";
    ctx.routingReason = "keyword_pre_check_booking";
    ctx._queryAnalysis = {
      agent: "appointment_booking", intent: "booking_request", entities: {}, urgency: "low", wants_human: false, emotional_tone: "calm",
    };
    return { handled: false };
  }

  const hasSalesIntent = /\b(price|cost|quote|how much|buy|order|pricing|rates|prices|menu)\b/i.test(msgLower);
  if (hasSalesIntent && activeAgents.has("sales")) {
    ctx.agentType = "sales";
    ctx.routingReason = "keyword_pre_check_sales";
    ctx._queryAnalysis = {
      agent: "sales", intent: "pricing_or_order", entities: {}, urgency: "low", wants_human: false, emotional_tone: "calm",
    };
    return { handled: false };
  }

  // Pre-check: if session has an active agent and message is a clear follow-up, keep it
  console.log(`[T2] workingAgent=${workingAgent} convCtxLen=${conversationContext?.length} hasActive=${workingAgent ? activeAgents.has(workingAgent) : "N/A"}`)
  if ((ctx.session.message_count ?? 0) > 0 && workingAgent && activeAgents.has(workingAgent) && conversationContext) {
    const isFollowUp = /^(ok|yes|yeah|sure|correct|right|that'?s? right|go ahead|please|okay|alright)/i.test(msg)
      || /(cancel|reschedule|reshedule|change|modify|book|schedule|appointment|consult|visit|service|design|construct|name|date|time|email|phone|contact|tomorrow|today|next|hours|this\s+(week|month))/i.test(msg);
    console.log(`[T2] followUpCheck=${isFollowUp}`)
    if (isFollowUp) {
      console.log(`[T2] WORKING CONTEXT: keeping agent ${workingAgent}`)
      ctx.agentType = workingAgent;
      ctx.routingReason = "working_context_follow_up";
      ctx._queryAnalysis = {
        agent: workingAgent as any, intent: "follow_up", entities: {}, urgency: "low", wants_human: false, emotional_tone: "calm",
      };
      return { handled: false };
    }
  }

  const analysis = await llmClassify(ctx, [...activeAgents], conversationContext);

  if (!activeAgents.has(analysis.agent)) {
    ctx.agentType = activeAgents.has("customer_support") ? "customer_support" : [...activeAgents][0] || "customer_support";
    ctx.routingReason = `requested_agent_unavailable_${analysis.agent}`;
  } else {
    ctx.agentType = analysis.agent;
    ctx.routingReason = `llm_classified_${analysis.intent}`;
  }

  ctx._queryAnalysis = analysis;

  if (analysis.sub_tasks && analysis.sub_tasks.length > 0) {
    ctx._subTasks = analysis.sub_tasks;
  }

  if (analysis.wants_human) {
    ctx._wantsHuman = true;
  }

  return { handled: false };
}
