import { PipelineContext, TierResult, QueryAnalysis } from "../lib/types.ts";
import { callRouterModel } from "../lib/llm.ts";

const QUERY_ANALYSIS_PROMPT = `You are a query classifier for a business AI assistant. Your job is to analyze the user's message and determine:
1. Which agent should handle it
2. What the user's intent is
3. Key entities (names, dates, services, etc.)
4. Urgency level
5. Whether they want a human
6. Whether the query has MULTIPLE requests that need different agents

Available agents:
- customer_support: General questions about the business, services, hours, policies, support issues
- appointment_booking: Booking, rescheduling, checking availability, cancelling appointments
- sales: Pricing inquiries, menu browsing, ordering products/services, lead capture

Rules:
- If the user asks about the business (services, hours, locations, general info) -> customer_support
- If the user wants to book/schedule/reschedule/cancel an appointment -> appointment_booking
- If the user asks about pricing, menu, ordering, buying products -> sales
- If the user is asking "what services do you offer" or "what do you do" -> customer_support (general business info)
- If the user mentions booking-related words like "book", "schedule", "appointment", "consultation", "slot", "available" with a date/time -> appointment_booking
- If the user provides their email, phone number, or confirms details (e.g. "yes" / "sure" / email address) and the previous conversation was about booking an appointment -> appointment_booking
- If the user wants a human/manager/supervisor -> mark wants_human as true
- **Task Decomposition**: If the message contains MULTIPLE distinct requests that would need different agents, list them in sub_tasks. Example: "I want to book an appointment and check pricing" -> agent: appointment_booking, sub_tasks: [{agent:"appointment_booking",intent:"book appointment"}, {agent:"sales",intent:"check pricing"}]

Respond ONLY with valid JSON:
{
  "agent": "customer_support" | "appointment_booking" | "sales",
  "intent": "short description of what user wants",
  "entities": { "service": "", "date": "", "name": "", "phone": "", "product": "" },
  "urgency": "low" | "medium" | "high",
  "wants_human": false,
  "emotional_tone": "calm" | "positive" | "frustrated" | "urgent" | "distressed",
  "sub_tasks": []
}`;

async function llmClassify(ctx: PipelineContext, activeAgents: string[], conversationContext: string): Promise<QueryAnalysis> {
  const msg = ctx.payload.message;
  const agentList = activeAgents.map(a => a.replace("_", " ")).join(", ");

  try {
    const systemPrompt = QUERY_ANALYSIS_PROMPT + `\n\nActive agents for this workspace: ${agentList}`;
    const messages: any[] = [];
    if (conversationContext) {
      messages.push({ role: "user", content: `Previous conversation:\n${conversationContext}\n\nNew message: ${msg}` });
    } else {
      messages.push({ role: "user", content: msg });
    }

    const llmPayload = {
      system: systemPrompt,
      messages,
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.1,
    };

    const llmResponse = await callRouterModel(llmPayload);
    const raw = llmResponse.choices?.[0]?.message?.content || "{}";
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

  // Context-aware routing for follow-up messages: if the session has an active flow
  // and the message is short (likely a follow-up), keep routing to the same agent.
  const wc = ctx.session?.working_context;
  const currentAgentType = ctx.session?.agent_type;
  const isShortFollowUp = msg.length < 60 && /^(?:ok|sure|yes|no|thanks|raksh|okay|my|please|id|email|@|https?)/i.test(msg.trim());
  if (isShortFollowUp && wc?.pending_action && currentAgentType && activeAgents.has(currentAgentType)) {
    ctx.agentType = currentAgentType;
    ctx.routingReason = "context_short_followup";
    ctx._queryAnalysis = {
      agent: currentAgentType as any,
      intent: wc.intent || "follow_up",
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
      .limit(4);
    if (recent && recent.length > 0) {
      const lines = recent.reverse().map(m =>
        `${m.role === "agent" ? "Assistant" : "Customer"}: ${m.content.slice(0, 200)}`
      );
      conversationContext = lines.join("\n");
    }
  } catch (_) {}

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
