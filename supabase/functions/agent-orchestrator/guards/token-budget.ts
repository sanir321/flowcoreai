import { PipelineContext } from "../lib/types.ts";

export function checkTokenBudget(ctx: PipelineContext, workspace: any): string | null {
  const dailyLimit = workspace.guardrail_config?.daily_token_limit ?? 50000;
  if ((ctx.session.total_tokens_used ?? 0) >= dailyLimit) {
    return workspace.guardrail_config?.limit_reached_message
      ?? "Your conversation has reached its limit. A human agent will take over.";
  }
  return null;
}
