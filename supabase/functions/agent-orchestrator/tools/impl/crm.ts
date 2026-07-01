import { PipelineContext } from "../../lib/types.ts";
import { getGoogleConfig } from "./google.ts";

const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
const CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";

function potentialToScore(potential: string): number {
  switch (potential) {
    case "high": return 80;
    case "intermediate": return 50;
    case "low": return 20;
    default: return 0;
  }
}

export async function captureLead(
  params: { name?: string; email?: string; phone?: string; notes?: string; potential?: string },
  ctx: PipelineContext
) {
  if (!params.name && !params.email && !params.phone) {
    return { success: false, error: "At least one of name, email, or phone is required to capture a lead." };
  }
  const jid = ctx.payload.customer_jid || ctx.session.customer_jid;
  const { data: existing } = await ctx.supabase
    .from("contacts")
    .select("id")
    .eq("workspace_id", ctx.payload.workspace_id)
    .or(`whatsapp_jid.eq.${jid},session_token.eq.${jid}`)
    .maybeSingle();
  const updateData: Record<string, unknown> = {
    name: params.name, email: params.email, phone: params.phone,
    notes: params.notes ? `[Lead] ${params.notes}` : undefined,
    updated_at: new Date().toISOString()
  };
  if (params.potential) updateData.lead_score = potentialToScore(params.potential);
  const insertData: Record<string, unknown> = {
    workspace_id: ctx.payload.workspace_id,
    [ctx.payload.source === "whatsapp" ? "whatsapp_jid" : "session_token"]: jid,
    name: params.name, email: params.email, phone: params.phone, notes: params.notes
  };
  if (params.potential) insertData.lead_score = potentialToScore(params.potential);
  const { data: contact } = existing
    ? await ctx.supabase.from("contacts").update(updateData).eq("id", existing.id).select().single()
    : await ctx.supabase.from("contacts").insert(insertData).select().single();

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
      const row = [params.name ?? "", params.email ?? "", params.phone ?? "", params.potential ?? "", "", new Date().toISOString(), new Date().toISOString()];
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gConfig.sheet_id}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
      });
    }
  } catch (_) {}

  // Send lead dashboard notification
  try {
    await ctx.supabase.from("notifications").insert({
      id: crypto.randomUUID(),
      workspace_id: ctx.payload.workspace_id,
      title: "New Lead Captured",
      message: `${params.name || "A customer"} has been captured as a lead${params.potential ? ` (${params.potential} potential)` : ""}.`,
      type: "lead",
      link: "/contacts",
      created_at: new Date().toISOString(),
    });
  } catch (_) {}

  // Send lead email notification if enabled
  try {
    const { data: notifPref } = await ctx.supabase
      .from("workspace_notifications")
      .select("email_on_lead, notification_mode")
      .eq("workspace_id", ctx.payload.workspace_id)
      .maybeSingle();

    if (notifPref?.email_on_lead && notifPref?.notification_mode === "instant") {
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
    .select("pipeline_stage, name")
    .eq("workspace_id", ctx.payload.workspace_id)
    .not("pipeline_stage", "is", null)
    .in("pipeline_stage", stages);
  const counts: Record<string, number> = {};
  for (const s of stages) counts[s] = 0;
  for (const c of contacts || []) {
    if (c.pipeline_stage) counts[c.pipeline_stage] = (counts[c.pipeline_stage] || 0) + 1;
  }
  const totalLeads = Object.values(counts).reduce((a, b) => a + b, 0);
  
  if (totalLeads === 0) {
    return { 
      success: true, 
      pipeline: counts, 
      summary: "Your pipeline is empty. Start capturing leads to build your sales pipeline!",
      total_leads: 0
    };
  }
  
  const activeStages = stages.filter(s => counts[s] > 0).map(s => `${s}: ${counts[s]}`);
  return { 
    success: true, 
    pipeline: counts, 
    summary: `Pipeline: ${activeStages.join(", ")}. Total: ${totalLeads} leads.`,
    total_leads: totalLeads
  };
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

