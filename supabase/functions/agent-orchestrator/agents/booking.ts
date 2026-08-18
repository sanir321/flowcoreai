import { PipelineContext } from "../lib/types.ts";
import { resolveAgentPromptWithOverrides } from "../lib/template-engine.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildBookingSystemPrompt(ctx: PipelineContext): string {
  const overrides = (ctx.workspace as any)?.agent_templates;
  const prompt = resolveAgentPromptWithOverrides("appointment_booking", ctx, overrides);
  const persona = getPersonaInstructions(ctx.agentConfig?.traits as any);
  
  let firstMsgInstruction = "";
  if ((ctx.session.message_count || 0) <= 1) {
    firstMsgInstruction = `\n\nCRITICAL DIRECTIVE: This is the very first message from the user. You MUST start your response by warmly welcoming them to ${ctx.workspace?.name || 'our business'}!`;
  }
  
  return prompt + persona + firstMsgInstruction;
}
