import { PipelineContext } from "../lib/types.ts";

const EXACT_GREETINGS = ["hi", "hello", "hey", "hlo", "hii", "helo", "hai", "sup", "yo"];

export function checkGreeting(ctx: PipelineContext, workspace: any): string | null {
  if ((ctx.session.message_count ?? 0) > 0) return null;

  const normalized = ctx.payload.message.toLowerCase().trim().replace(/[^\w\s]/g, "");
  if (EXACT_GREETINGS.includes(normalized)) {
    return workspace.welcome_template
      ?? `Hi! Welcome to ${workspace.name ?? "our business"}. How can I help you today?`;
  }
  return null;
}
