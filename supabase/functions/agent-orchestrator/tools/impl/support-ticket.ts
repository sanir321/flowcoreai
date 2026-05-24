import { PipelineContext } from "../../lib/types.ts";

export async function createTicket(
  params: { subject: string; description: string; priority?: string },
  ctx: PipelineContext
) {
  if (!params.subject) return { error: "Subject is required" };

  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

  const { data: session } = await ctx.supabase
    .from("conversation_sessions")
    .select("contact_id")
    .eq("id", ctx.session.id)
    .single();

  const { data: ticket, error } = await ctx.supabase
    .from("support_tickets")
    .insert({
      workspace_id: ctx.payload.workspace_id,
      session_id: ctx.session.id,
      contact_id: session?.contact_id || null,
      ticket_number: ticketNumber,
      subject: params.subject,
      description: params.description || "",
      priority: params.priority || "normal",
      status: "open"
    })
    .select()
    .single();

  if (error) {
    console.error("[createTicket] DB insert failed:", error.message);
    return { error: "Failed to create support ticket. Please try again." };
  }

  return {
    success: true,
    ticket_id: ticket?.id,
    ticket_number: ticketNumber,
    status: "open",
    priority: params.priority || "normal"
  };
}
