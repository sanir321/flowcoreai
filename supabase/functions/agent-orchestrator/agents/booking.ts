import { PipelineContext } from "../lib/types.ts";
import { resolveAgentPromptWithOverrides } from "../lib/template-engine.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildBookingSystemPrompt(ctx: PipelineContext): string {
  const overrides = (ctx.workspace as any)?.agent_templates;
  const prompt = resolveAgentPromptWithOverrides("appointment_booking", ctx, overrides);
  const persona = getPersonaInstructions(ctx.agentConfig?.traits as any);
  return prompt + persona;
}
