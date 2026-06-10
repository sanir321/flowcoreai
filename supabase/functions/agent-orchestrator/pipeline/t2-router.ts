import { PipelineContext, TierResult } from "../lib/types.ts";
import { matchChunks } from "../tools/impl/kb.ts";

const BOOKING_KEYWORDS = [
  "book", "appointment", "schedule", "reserve", "slot",
  "booking", "appoint", "fix appointment", "set appointment",
  "consultation", "checkup", "check up"
];
const SALES_KEYWORDS = [
  "order", "buy", "purchase", "price", "pricing", "cost", "menu",
  "how much", "rate", "quote", "payment", "pay", "offer",
  "discount", "deal", "product", "service list", "what do you sell",
  "b2b", "tiers", "subscription", "plan", "enterprise", "integration"
];

export async function runT2(ctx: PipelineContext): Promise<TierResult> {
  const msgLower = ctx.payload.message.toLowerCase();

  // 0. Resolve which agent types are active in this workspace
  const { data: activeAgentRows } = await ctx.supabase
    .from("workspace_agents")
    .select("agent_type")
    .eq("workspace_id", ctx.session.workspace_id)
    .eq("status", "active")
    .is("deleted_at", null);
  const activeAgents = new Set(activeAgentRows?.map(a => a.agent_type) || []);

  // 1. Mid-conversation FSM lock
  const { data: bookingState } = await ctx.supabase
    .from("booking_sessions")
    .select("state")
    .eq("session_id", ctx.session.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const midBooking = bookingState && !["idle", "booked", "cancelled"].includes(bookingState.state);
  const managementKeywords = ["reschedule", "move", "cancel", "change", "rebook", "re-schedule", "modify"];
  const hasManagementIntent = managementKeywords.some(kw => msgLower.includes(kw));

  if (midBooking) {
    ctx.agentType = "appointment_booking";
    ctx.routingReason = "mid_booking";
  } else {
    const channel = ctx.payload.source || ctx.payload.channel;

    // Widget channel: respect session's assigned agent, only route on explicit booking intent
    if (channel === "widget") {
      if (midBooking) {
        ctx.agentType = "appointment_booking";
        ctx.routingReason = "mid_booking";
      } else if (activeAgents.has("appointment_booking") && BOOKING_KEYWORDS.some(k => msgLower.includes(k))) {
        ctx.agentType = "appointment_booking";
        ctx.routingReason = "keyword_booking";
        if (hasManagementIntent) ctx.routingReason = "management_intent";
      } else if (ctx.session.agent_type && activeAgents.has(ctx.session.agent_type)) {
        ctx.agentType = ctx.session.agent_type;
        ctx.routingReason = "session_continuity";
      } else if (activeAgents.has("customer_support")) {
        ctx.agentType = "customer_support";
        ctx.routingReason = "default_fallback";
      } else {
        return {
          handled: true,
          response: "I'm sorry, I'm not equipped to handle that type of request. Please contact the business directly for assistance.",
          reason: "no_matching_agent"
        };
      }
    } else {
      // Non-widget: full keyword routing
      if (activeAgents.has("appointment_booking") && BOOKING_KEYWORDS.some(k => msgLower.includes(k))) {
        ctx.agentType = "appointment_booking";
        ctx.routingReason = "keyword_booking";
        if (hasManagementIntent) ctx.routingReason = "management_intent";
      } else if (activeAgents.has("sales") && SALES_KEYWORDS.some(k => msgLower.includes(k))) {
        ctx.agentType = "sales";
        ctx.routingReason = "keyword_sales";
      } else if (ctx.session.agent_type && activeAgents.has(ctx.session.agent_type) && ctx.session.message_count >= 1) {
        ctx.agentType = ctx.session.agent_type;
        ctx.routingReason = "session_continuity";
      } else if (activeAgents.has("customer_support")) {
        ctx.agentType = "customer_support";
        ctx.routingReason = "default_fallback";
      } else {
        return {
          handled: true,
          response: "I'm sorry, I'm not equipped to handle that type of request. Please contact the business directly for assistance.",
          reason: "no_matching_agent"
        };
      }
    }
  }

  // If management intent, ensure we tell the Planner it's a priority
  if (hasManagementIntent && ctx.agentType === "appointment_booking") {
    ctx.routingReason = "management_priority";
  }

  // Speculative KB search: start fetching chunks while LLM is planning
  if (ctx.agentType === "customer_support" && ctx.workspace?.kb_enabled) {
    ctx.kbSearchPromise = matchChunks({ query: ctx.payload.message }, ctx);
  }

  return { handled: false };
}
