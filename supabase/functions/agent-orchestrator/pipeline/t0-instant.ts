import { PipelineContext, TierResult } from "../lib/types.ts";
import { runAllGuards } from "../guards/index.ts";

export async function runT0(ctx: PipelineContext): Promise<TierResult> {
  const { payload, supabase } = ctx;

  // 0. Skip empty/whitespace-only messages — don't waste credits
  if (!payload.message || payload.message.trim().length === 0) {
    return {
      handled: true,
      response: "",
      reason: "empty_message_skipped"
    };
  }

  // 1. Store inbound message if not already stored by gowa-webhook or widget route
  if (payload.source !== "widget") {
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
        /* message stored */
      } catch (e: any) {
        console.error("[T0] Message store failed:", e.message);
        // Non-fatal — pipeline continues, message dedup handled at webhook layer
      }
    }
  }

  // 1b. If session was already escalated, tell customer it's still being handled
  if (ctx.session?.status === "escalated") {
    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.handoff_message
        ?? "Your request has been escalated to our team. They will get back to you shortly.",
      reason: "already_escalated"
    };
  }

  // 2. Run all guardrails
  const guardResult = await runAllGuards(ctx, ctx.workspace);
  if (guardResult) {
    // Return ALL guard results — each guard has already decided to handle the message
    return guardResult;
  }

  return { handled: false };
}
