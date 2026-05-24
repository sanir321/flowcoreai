import { PipelineContext } from "../lib/types.ts";

const NON_TEXT_TYPES = ["image", "audio", "document", "sticker", "reaction", "video"];

export function checkNonText(ctx: PipelineContext): string | null {
  if (NON_TEXT_TYPES.includes(ctx.payload.message_type)) {
    return "I can only read text messages right now. Please type your question!";
  }
  return null;
}
