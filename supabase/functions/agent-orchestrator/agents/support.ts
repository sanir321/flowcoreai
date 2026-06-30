import { PipelineContext } from "../lib/types.ts";
import { resolveAgentPromptWithOverrides } from "../lib/template-engine.ts";

export function buildSupportSystemPrompt(ctx: PipelineContext): string {
  const overrides = (ctx.workspace as any)?.agent_templates;
  return resolveAgentPromptWithOverrides("customer_support", ctx, overrides);
}
