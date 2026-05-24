import { PipelineContext } from "../lib/types.ts";

export function checkBlockedTopics(ctx: PipelineContext, workspace: any): string | null {
  const blockedTopics: string[] = workspace.guardrail_config?.blocked_topics ?? [];
  if (blockedTopics.length === 0) return null;

  const msgLower = ctx.payload.message.toLowerCase();
  if (blockedTopics.some(topic => msgLower.includes(topic.toLowerCase()))) {
    return workspace.guardrail_config?.fallback_message
      ?? "I'm sorry, I can't help with that. Please contact the business directly.";
  }
  return null;
}
