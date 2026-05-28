import { PipelineContext } from "../lib/types.ts";

export function checkGreeting(ctx: PipelineContext, workspace: any): string | null {
  if ((ctx.session.message_count ?? 0) > 0) return null;

  if (workspace.welcome_template) {
    return workspace.welcome_template;
  }

  const businessName = workspace.name ?? "our business";
  return `Hi! Welcome to ${businessName}. How can I help you today? 👋`;
}
