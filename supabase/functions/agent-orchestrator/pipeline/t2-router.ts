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
    if (BOOKING_KEYWORDS.some(k => msgLower.includes(k))) {
      ctx.agentType = "appointment_booking";
      ctx.routingReason = "keyword_booking";
      if (hasManagementIntent) ctx.routingReason = "management_intent";
    } else if (SALES_KEYWORDS.some(k => msgLower.includes(k))) {
      ctx.agentType = "sales";
      ctx.routingReason = "keyword_sales";
    } else if (ctx.session.agent_type && ctx.session.message_count >= 1) {
      ctx.agentType = ctx.session.agent_type;
      ctx.routingReason = "session_continuity";
    } else {
      ctx.agentType = "customer_support";
      ctx.routingReason = "default";
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
