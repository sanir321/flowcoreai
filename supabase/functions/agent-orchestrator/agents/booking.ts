import { PipelineContext } from "../lib/types.ts";
import { resolveAgentPromptWithOverrides } from "../lib/template-engine.ts";

export function buildBookingSystemPrompt(ctx: PipelineContext): string {
  const overrides = (ctx.workspace as any)?.agent_templates;
  return resolveAgentPromptWithOverrides("appointment_booking", ctx, overrides);
}
