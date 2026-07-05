import { PipelineContext } from "../lib/types.ts";
import { resolveAgentPromptWithOverrides } from "../lib/template-engine.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildSupportSystemPrompt(ctx: PipelineContext): string {
  const overrides = (ctx.workspace as any)?.agent_templates;
  const prompt = resolveAgentPromptWithOverrides("customer_support", ctx, overrides);
  const persona = getPersonaInstructions(ctx.agentConfig?.traits as any);
  return prompt + persona;
}
