import { PipelineContext } from "../lib/types.ts";
import { resolveAgentPromptWithOverrides } from "../lib/template-engine.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildSupportSystemPrompt(ctx: PipelineContext): string {
  const overrides = (ctx.workspace as any)?.agent_templates;
  const prompt = resolveAgentPromptWithOverrides("customer_support", ctx, overrides);
  const persona = getPersonaInstructions(ctx.agentConfig?.traits as any);
  
  let firstMsgInstruction = "";
  if ((ctx.session.message_count || 0) <= 1) {
    firstMsgInstruction = `\n\nCRITICAL DIRECTIVE: This is the very first message from the user. You MUST start your response by warmly welcoming them to ${ctx.workspace?.name || 'our business'}!`;
  }

  let widgetInstruction = "";
  if (ctx.payload.source === "widget") {
    widgetInstruction = `\n\nCRITICAL DIRECTIVE: You are operating on the web widget. You do NOT have the ability to process bookings or sales on this channel. If the user asks to book an appointment, buy something, or asks about pricing/packages, DO NOT offer to escalate them to a human. Instead, clearly tell them that bookings and sales are handled exclusively through WhatsApp, and instruct them to message us on WhatsApp.`;
  }
  
  return prompt + persona + firstMsgInstruction + widgetInstruction;
}
