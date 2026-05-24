import { PipelineContext } from "../lib/types.ts";

const DEFAULT_KEYWORDS = [
  "human", "agent", "person", "manager", "staff", "real person",
  "manav", "insaan", "human chahiye", "real agent", "talk to someone",
  "refund", "refund chahiye", "complaint"
];

export async function checkEscalation(ctx: PipelineContext, workspace: any): Promise<string | null> {
  const keywords = workspace.guardrail_config?.escalation_keywords ?? DEFAULT_KEYWORDS;
  const msgLower = ctx.payload.message.toLowerCase();
  if (!keywords.some((k: string) => msgLower.includes(k))) return null;

  await ctx.supabase.from("conversation_sessions")
    .update({ status: "escalated", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);

  return workspace.guardrail_config?.handoff_message
    ?? "I've notified our team and a human will get back to you shortly.";
}
