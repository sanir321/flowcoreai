import { PipelineContext } from "../lib/types.ts";

const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
const CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";

const DEFAULT_KEYWORDS = [
  "human", "agent", "person", "manager", "staff", "real person",
  "talk to someone", "talk to a person",
  "refund", "complaint",
  // Generic escalation keywords
  "owner", "call owner", "contact person", "talk to owner", "director", "boss",
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

  // Send immediate email notification to workspace owner
  try {
    const ownerEmail = workspace.owner_id
      ? await ctx.supabase.rpc("get_user_email", { user_id: workspace.owner_id })
      : null;
    if (ownerEmail?.data) {
      await fetch(`${APP_URL}/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
        body: JSON.stringify({
          to: ownerEmail.data,
          subject: `Escalation Alert — ${workspace.name || "Your Workspace"}`,
          template: "escalation",
          data: {
            workspaceName: workspace.name || "Your Workspace",
            customerName: ctx.contact?.name || ctx.session?.customer_name || "A Customer",
            reason: msgLower,
            inboxUrl: `${APP_URL}/inbox`,
          },
        }),
      });
    }
  } catch (e: any) {
    console.error("[ESCALATION] Email notification error:", e.message);
  }

  return workspace.guardrail_config?.handoff_message
    ?? "I've notified our team and a human will get back to you shortly.";
}
