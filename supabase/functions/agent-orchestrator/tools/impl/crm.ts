import { PipelineContext } from "../../lib/types.ts";
import { getGoogleConfig } from "./google.ts";

const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
const CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";

export async function captureLead(
  params: { name?: string; email?: string; phone?: string; notes?: string },
  ctx: PipelineContext
) {
  const { data: contact } = await ctx.supabase.from("contacts").upsert({
    workspace_id: ctx.payload.workspace_id,
    name: params.name, email: params.email, phone: params.phone, notes: params.notes
  }).select().single();

  // Link contact to session immediately (fix: session.contact_id was never set)
  let sessionLinked = false;
  if (contact?.id) {
    const { error: linkError } = await ctx.supabase
      .from("conversation_sessions")
      .update({ contact_id: contact.id, updated_at: new Date().toISOString() })
      .eq("id", ctx.session.id);
    sessionLinked = !linkError;
  }

  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    if (gConfig?.sheet_id) {
      const sheetRange = gConfig.sheet_range ?? "Sheet1!A:Z";
      const row = [params.name ?? "", params.email ?? "", params.phone ?? "", "", "", new Date().toISOString(), new Date().toISOString()];
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gConfig.sheet_id}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
      });
    }
  } catch (_) {}

  // Send lead notification if enabled
  try {
    const { data: notifPref } = await ctx.supabase
      .from("workspace_notifications")
      .select("email_on_lead, notification_mode")
      .eq("workspace_id", ctx.payload.workspace_id)
      .maybeSingle();

    if (notifPref?.email_on_lead && notifPref?.notification_mode !== "off") {
      const { data: workspace } = await ctx.supabase
        .from("workspaces")
        .select("owner_id, name")
        .eq("id", ctx.payload.workspace_id)
        .maybeSingle();

      if (workspace?.owner_id) {
        const { data: ownerEmail } = await ctx.supabase.rpc("get_user_email", { user_id: workspace.owner_id });
        if (ownerEmail) {
          await fetch(`${APP_URL}/api/emails/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
            body: JSON.stringify({
              to: ownerEmail,
              subject: `New Lead Captured — ${workspace.name || "Your Workspace"}`,
              template: "welcome",
              data: {
                workspaceName: workspace.name || "Your Workspace",
                customerName: params.name || "Unknown",
                customerEmail: params.email || "No email",
              },
            }),
          });
        }
      }
    }
  } catch (e: any) {
    console.error("[CAPTURE_LEAD] Notification error:", e.message);
  }

  return {
    success: true,
    contact_id: contact?.id,
    session_linked: sessionLinked,
    ...(sessionLinked ? {} : { warning: "Contact saved but failed to link to session" })
  };
}

export async function updateLeadStage(
  params: { stage: string; notes?: string },
  ctx: PipelineContext
) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  if (!session?.contact_id) return { error: "Contact not found" };
  await ctx.supabase.from("contacts").update({
    pipeline_stage: params.stage,
    notes: params.notes ? `[Stage: ${params.stage}] ${params.notes}` : undefined,
    updated_at: new Date().toISOString()
  }).eq("id", session.contact_id);
  return { success: true, stage: params.stage };
}

export async function getPipeline(params: Record<string, unknown>, ctx: PipelineContext) {
  const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
  const { data: contacts } = await ctx.supabase
    .from("contacts")
    .select("pipeline_stage")
    .eq("workspace_id", ctx.payload.workspace_id)
    .not("pipeline_stage", "is", null)
    .in("pipeline_stage", stages);
  const counts: Record<string, number> = {};
  for (const s of stages) counts[s] = 0;
  for (const c of contacts || []) {
    if (c.pipeline_stage) counts[c.pipeline_stage] = (counts[c.pipeline_stage] || 0) + 1;
  }
  return { success: true, pipeline: counts };
}

export async function scheduleFollowUp(
  params: { hours?: number; message?: string },
  ctx: PipelineContext
) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  const scheduledAt = new Date(Date.now() + (params.hours || 24) * 3600000).toISOString();
  const { data: followUp } = await ctx.supabase.from("follow_ups").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: session?.contact_id || null,
    session_id: ctx.session.id,
    scheduled_at: scheduledAt,
    message_template: params.message || "Hi! Just following up on our conversation. Let me know if you need any help!",
    status: "pending"
  }).select().single();
  return { success: true, follow_up_id: followUp?.id, scheduled_at: scheduledAt };
}

export async function generateQuote(
  params: { items?: { name: string; qty?: number; price?: number }[]; notes?: string },
  ctx: PipelineContext
) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id, customer_name, customer_jid").eq("id", ctx.session.id).single();
  if (!session) return { error: "Session not found" };
  const subtotal = (params.items || []).reduce((sum: number, item) => sum + (item.qty || 1) * (item.price || 0), 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + tax;
  const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;
  const { data: quote } = await ctx.supabase.from("quotes").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: session.contact_id || null,
    quote_number: quoteNumber,
    items: params.items,
    subtotal, tax, total, status: "draft",
    notes: params.notes || null,
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  }).select().single();
  const quoteText = `*Quote ${quoteNumber}*\n\n${(params.items || []).map(i => `${i.name} × ${i.qty || 1} = ₹${((i.qty || 1) * i.price).toLocaleString()}`).join("\n")}\n\nSubtotal: ₹${subtotal.toLocaleString()}\nTax (18%): ₹${tax.toLocaleString()}\n*Total: ₹${total.toLocaleString()}*\n\nValid until: ${new Date(Date.now() + 30 * 86400000).toLocaleDateString()}`;
  return { success: true, quote_id: quote?.id, quote_number: quoteNumber, total, quote_text: quoteText };
}
