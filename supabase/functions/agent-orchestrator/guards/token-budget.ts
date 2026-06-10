import { PipelineContext } from "../lib/types.ts";

export function checkTokenBudget(ctx: PipelineContext, workspace: any): string | null {
  const sessionLimit = workspace.guardrail_config?.session_token_limit
    ?? workspace.guardrail_config?.daily_token_limit
    ?? 50000;
  if ((ctx.session.total_tokens_used ?? 0) >= sessionLimit) {
    return workspace.guardrail_config?.limit_replied_message
      ?? workspace.guardrail_config?.limit_reached_message
      ?? "Your conversation has reached its limit. A human agent will take over.";
  }
  return null;
}
