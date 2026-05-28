import { PipelineContext } from "../lib/types.ts";

const DEFAULT_KEYWORDS = [
  "human", "agent", "person", "manager", "staff", "real person",
  "manav", "insaan", "human chahiye", "real agent", "talk to someone",
  "refund", "refund chahiye", "complaint",
  // Tamil escalation keywords
  "owner", "samir", "paal", "dabbaaa", "call owner", "call samir",
  "owner ah kupuda", "owner ah kupududa", "owner ah kootu",
  "contact person", "contact samir", "talk to owner",
  "enna da nadakku", "nadakku da", "director", "boss ah",
  "owner number", "samir number", "paal dabbaaa",
  // Emotional escalation signals
  "frustrated", "fed up", "waste", "useless", "scam", "cheating",
  "terrible service", "worst", "hopeless", "not helpful"
];

export async function checkEscalation(ctx: PipelineContext, workspace: any): Promise<string | null> {
  // Don't re-escalate if already escalated
  if (ctx.session?.status === "escalated") return null;

  const customKeywords = workspace.guardrail_config?.escalation_keywords;
  const keywords = customKeywords ? [...new Set([...DEFAULT_KEYWORDS, ...customKeywords])] : DEFAULT_KEYWORDS;
  const msgLower = ctx.payload.message.toLowerCase();
  if (!keywords.some((k: string) => msgLower.includes(k))) return null;

  await ctx.supabase.from("conversation_sessions")
    .update({ status: "escalated", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);

  // Log escalation for observability
  try {
    await ctx.supabase.from("escalation_logs").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trigger_type: "guardrail_hit",
      trigger_message: msgLower,
      conversation_snapshot: { message: ctx.payload.message.substring(0, 500) },
      status: "open"
    });
  } catch (e: any) {
    console.error("[ESCALATION] Failed to insert escalation_log:", e.message);
  }

  return workspace.guardrail_config?.handoff_message
    ?? "I've notified our team and a human will get back to you shortly.";
}
