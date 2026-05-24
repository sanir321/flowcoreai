import { PipelineContext } from "../lib/types.ts";

export function checkCredits(ctx: PipelineContext, workspace: any): string | null {
  if ((workspace.credits_remaining ?? workspace.credits_balance ?? 0) <= 0) {
    return workspace.guardrail_config?.out_of_credits_message
      ?? "Our service is currently unavailable. Please contact the business directly.";
  }
  return null;
}
