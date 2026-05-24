import { PipelineContext, TierResult } from "../lib/types.ts";
import { runAllGuards } from "../guards/index.ts";

export async function runT0(ctx: PipelineContext): Promise<TierResult> {
  const { payload, supabase } = ctx;

  // 1. Store inbound message if not already stored by gowa-webhook
  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("gowa_message_id", payload.gowa_message_id)
    .maybeSingle();

  if (!existing) {
    try {
      await supabase.from("messages").insert({
        workspace_id: payload.workspace_id,
        session_id: ctx.session.id,
        content: payload.message || payload.message_type || "[non-text]",
        direction: "inbound",
        role: "customer",
        gowa_message_id: payload.gowa_message_id
      });
      console.log("[T0] Inbound message stored.")
    } catch (e: any) {
      console.error("[T0] Message store failed:", e.message)
    }
  }

  // 2. Run all guardrails
  const guardResult = await runAllGuards(ctx, ctx.workspace);
  if (guardResult) {
    // Escalation: return early so T3 can handle the handoff
    if (guardResult.reason?.includes("escalation")) {
      return guardResult;
    }
    // Hard blocks: credits exhausted, blocked topics, 24h window expired
    if (guardResult.reason?.includes("credits") || guardResult.reason?.includes("blocked") || guardResult.reason?.includes("window")) {
      return guardResult;
    }
  }

  return { handled: false };
}
