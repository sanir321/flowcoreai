import { PipelineContext } from "../lib/types.ts";
import { resolveAgentPromptWithOverrides } from "../lib/template-engine.ts";

export function buildSalesSystemPrompt(ctx: PipelineContext): string {
  const overrides = (ctx.workspace as any)?.agent_templates;
  return resolveAgentPromptWithOverrides("sales", ctx, overrides);
}
