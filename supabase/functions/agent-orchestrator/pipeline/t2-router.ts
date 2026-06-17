import { PipelineContext, TierResult } from "../lib/types.ts";
import { matchChunks } from "../tools/impl/kb.ts";

function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const aBg = new Map<string, number>();
  const bBg = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.substring(i, i + 2);
    aBg.set(bg, (aBg.get(bg) || 0) + 1);
  }
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.substring(i, i + 2);
    bBg.set(bg, (bBg.get(bg) || 0) + 1);
  }
  let intersection = 0;
  for (const [bg, count] of aBg) {
    intersection += Math.min(count, bBg.get(bg) || 0);
  }
  return (2 * intersection) / (a.length - 1 + b.length - 1);
}

const AGENT_KEYWORDS: Record<string, { keywords: string[]; weights: number[] }> = {
  appointment_booking: {
    keywords: ["book", "appointment", "schedule", "reserve", "slot", "booking", "consultation", "checkup"],
    weights: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.8, 0.7]
  },
  sales: {
    keywords: ["order", "buy", "purchase", "price", "pricing", "cost", "menu", "how much", "rate", "quote", "payment", "pay", "offer", "discount", "deal", "product", "subscription", "tell me about", "what do you offer", "what can you", "do you provide", "features", "capabilities", "solutions", "about your", "how does", "can you help", "what do you do", "do you offer", "what is", "explain", "how it works", "demo", "show me", "packages", "plans", "services", "offerings", "what are your", "what kind of", "can you tell"],
    weights: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 0.9, 1.0, 1.0, 1.0, 0.8, 0.8, 0.7, 0.8, 0.9, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.6, 0.6]
  }
};

function scoreAgentType(msgLower: string, agentKeywords: typeof AGENT_KEYWORDS.appointment_booking): number {
  let maxScore = 0;
  for (let i = 0; i < agentKeywords.keywords.length; i++) {
    const kw = agentKeywords.keywords[i];
    const weight = agentKeywords.weights[i] || 1.0;
    if (msgLower.includes(kw)) {
      maxScore = Math.max(maxScore, 1.0 * weight);
    } else {
      const dice = diceCoefficient(msgLower, kw);
      if (dice >= 0.4) {
        maxScore = Math.max(maxScore, dice * weight * 0.8);
      }
    }
  }
  return maxScore;
}

export async function runT2(ctx: PipelineContext): Promise<TierResult> {
  const msgLower = ctx.payload.message.toLowerCase();

  const businessInfoKeywords = ["business hours", "working hours", "office hours", "open hours", "what are your hours", "what is your address", "your location", "where are you located", "your phone number", "your email address", "how to contact", "contact number", "phone number", "email address"];
  const isBusinessInfo = businessInfoKeywords.some(kw => msgLower.includes(kw));

  const { data: activeAgentRows } = await ctx.supabase
    .from("workspace_agents")
    .select("agent_type")
    .eq("workspace_id", ctx.session.workspace_id)
    .eq("status", "active")
    .is("deleted_at", null);
  const activeAgents = new Set(activeAgentRows?.map(a => a.agent_type) || []);

  const channel = ctx.payload.source || ctx.payload.channel;

  if (channel === "widget") {
    if (ctx.payload.agent_type && activeAgents.has(ctx.payload.agent_type)) {
      ctx.agentType = ctx.payload.agent_type;
      ctx.routingReason = "test_explicit";
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
    if (isBusinessInfo && activeAgents.has("customer_support")) {
      ctx.agentType = "customer_support";
      ctx.routingReason = "business_info_query";
      ctx.kbSearchPromise = matchChunks({ query: ctx.payload.message }, ctx);
      return { handled: false };
    }
    const scores: { agent: string; score: number }[] = [];
    if (activeAgents.has("appointment_booking")) {
      scores.push({ agent: "appointment_booking", score: scoreAgentType(msgLower, AGENT_KEYWORDS.appointment_booking) });
    }
    if (activeAgents.has("sales")) {
      scores.push({ agent: "sales", score: scoreAgentType(msgLower, AGENT_KEYWORDS.sales) });
    }

    scores.sort((a, b) => b.score - a.score);
    const top = scores[0];

    if (top && top.score >= 0.3) {
      ctx.agentType = top.agent;
      ctx.routingReason = `keyword_match_${top.score.toFixed(2)}`;
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

    if (top && top.score < 0.3 && ctx.session.message_count >= 3) {
      const managementKeywords = ["reschedule", "cancel", "change", "modify", "update my"];
      const hasManagement = managementKeywords.some(kw => msgLower.includes(kw));
      if (hasManagement && ctx.session.agent_type === "appointment_booking") {
        ctx.routingReason = "management_priority";
      }
    }
  }

  if (ctx.agentType === "customer_support") {
    ctx.kbSearchPromise = matchChunks({ query: ctx.payload.message }, ctx);
  }

  return { handled: false };
}
