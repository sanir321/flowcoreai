import { PipelineContext } from "../lib/types.ts";

const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
const CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";

const DEFAULT_KEYWORDS = [
  "human", "agent", "person", "manager", "staff", "real person",
  "talk to someone", "talk to a person",
  "complaint",
  // Generic escalation keywords
  "owner", "call owner", "contact person", "talk to owner", "director", "boss",
  // Emotional escalation signals
  "frustrated", "fed up", "waste", "useless", "scam", "cheating",
  "terrible service", "worst", "hopeless", "not helpful"
];

export async function checkEscalation(ctx: PipelineContext, workspace: any): Promise<string | null> {
  // Don't re-escalate if already escalated
  if (ctx.session?.status === "escalated") return null;

  const customKeywords = workspace.guardrail_config?.escalation_keywords;
  const keywords = customKeywords ? [...new Set([...DEFAULT_KEYWORDS, ...customKeywords])] : DEFAULT_KEYWORDS;
  const msgLower = ctx.payload.message.toLowerCase();
  if (!keywords.some((k: string) => msgLower.includes(k))) return null;

  await ctx.supabase.from("conversation_sessions")
    .update({ status: "escalated", updated_at: new Date().toISOString() })
    .eq("id", ctx.session.id);

  // Log escalation for observability
  try {
    await ctx.supabase.from("escalation_logs").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trigger_type: "guardrail_hit",
      trigger_message: msgLower,
      conversation_snapshot: { message: ctx.payload.message.substring(0, 500) },
      status: "open"
    });
  } catch (e: any) {
    console.error("[ESCALATION] Failed to insert escalation_log:", e.message);
  }

  // Fetch notification preferences
  const { data: notifPref } = await ctx.supabase
    .from("workspace_notifications")
    .select("notification_mode, email_on_escalation, whatsapp_alert_number")
    .eq("workspace_id", ctx.payload.workspace_id)
    .maybeSingle();

  // Skip notifications if mode is "off"
  const notificationMode = notifPref?.notification_mode || "instant";

  // Send immediate email notification to workspace owner
  if (notificationMode !== "off" && notifPref?.email_on_escalation !== false) {
    try {
      const ownerEmail = workspace.owner_id
        ? await ctx.supabase.rpc("get_user_email", { user_id: workspace.owner_id })
        : null;
      if (ownerEmail?.data) {
        await fetch(`${APP_URL}/api/emails/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
          body: JSON.stringify({
            to: ownerEmail.data,
            subject: `Escalation Alert — ${workspace.name || "Your Workspace"}`,
            template: "escalation",
            data: {
              workspaceName: workspace.name || "Your Workspace",
              customerName: ctx.contact?.name || ctx.session?.customer_name || "A Customer",
              reason: msgLower,
              inboxUrl: `${APP_URL}/inbox`,
            },
          }),
        });
      }
    } catch (e: any) {
      console.error("[ESCALATION] Email notification error:", e.message);
    }
  }

  // Send WhatsApp alert if number is configured
  if (notifPref?.whatsapp_alert_number) {
    try {
      const { data: device } = await ctx.supabase
        .from("gowa_sessions")
        .select("gowa_session_id")
        .eq("workspace_id", ctx.payload.workspace_id)
        .eq("status", "connected")
        .maybeSingle();

      if (device?.gowa_session_id) {
        const gowaKey = Deno.env.get("GOWA_API_KEY") || "";
        const alertMsg = `🚨 *Escalation Alert*\n\nCustomer: ${ctx.contact?.name || ctx.session?.customer_name || "Unknown"}\nReason: ${msgLower}\n\nView inbox: ${APP_URL}/inbox`;
        await fetch(`${Deno.env.get("GOWA_BASE_URL")}/send/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(gowaKey)}`,
            "X-Device-Id": device.gowa_session_id
          },
          body: JSON.stringify({ phone: notifPref.whatsapp_alert_number, message: alertMsg }),
        });
      }
    } catch (e: any) {
      console.error("[ESCALATION] WhatsApp alert error:", e.message);
    }
  }

  return workspace.guardrail_config?.handoff_message
    ?? "I've notified our team and a human will get back to you shortly.";
}
