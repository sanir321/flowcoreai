import { PipelineContext, WorkspaceRow } from "../lib/types.ts";

export function checkWhatsAppWindow(ctx: PipelineContext, workspace: WorkspaceRow): string | null {
  if (ctx.payload.source !== "whatsapp") return null;

  const lastUserMsgAt = ctx.session.last_customer_message_at;
  if (!lastUserMsgAt) return null;

  const hoursSinceLastMsg = (Date.now() - new Date(lastUserMsgAt).getTime()) / 3600000;
  if (hoursSinceLastMsg > 23.5) {
    return workspace.guardrail_config?.window_expired_message
      ?? "Our response window has closed. A human agent will get back to you soon.";
  }
  return null;
}
