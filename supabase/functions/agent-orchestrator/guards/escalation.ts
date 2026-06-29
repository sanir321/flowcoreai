import { PipelineContext } from "../lib/types.ts";

const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
const CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";

// Only trigger escalation on explicit requests for human handoff or severe emotional distress
// Single-word emotional signals like "frustrated" are NOT enough — require context
const DEFAULT_KEYWORDS = [
  // Explicit human handoff requests
  "talk to a human", "talk to a person", "speak to a human", "speak to a person",
  "connect me to", "transfer me to", "escalate to",
  // Management/authority requests
  "talk to manager", "speak to manager", "talk to owner", "speak to owner",
  "call manager", "call owner", "contact manager", "contact owner",
  "where is the manager", "where is the owner", "get me the boss",
  // Severe emotional distress (require compound phrases, not single words)
  "i am furious", "i'm furious", "this is unacceptable", "unacceptable service",
  "worst service ever", "terrible service", "absolutely terrible",
  "i want a refund", "give me a refund", "refund my money",
  "i will sue", "i'm going to sue", "legal action", "lawyer",
  "social media complaint", "posting on social", "chargeback",
];

// Turn short/ambiguous custom keywords into intent-bearing phrases so
// informational questions like "what is your refund policy" don't trigger escalation
function expandEscalationKeywords(keywords: string[]): string[] {
  const out: string[] = [];
  for (const kw of keywords) {
    const t = kw.trim().toLowerCase();
    if (!t) continue;
    if (t.includes(" ") && t.length >= 4) { out.push(t); continue; }
    const demand = [`i want a ${t}`, `give me a ${t}`, `i need a ${t}`, `demand a ${t}`];
    out.push(...demand);
    if (["refund","complaint","cancel"].includes(t)) out.push(`${t} my money`, `${t} immediately`, `i want my ${t}`, `i have a ${t}`, `filing a ${t}`, `lodging a ${t}`);
    if (["manager","owner","boss","supervisor"].includes(t))
      out.push(`talk to the ${t}`, `speak to the ${t}`, `call the ${t}`, `get me the ${t}`);
    if (t === "legal") out.push(`take ${t} action`, `seek ${t} advice`);
  }
  return out;
}
export async function checkEscalation(ctx: PipelineContext, workspace: any): Promise<string | null> {
  // Don't re-escalate if already escalated
  if (ctx.session?.status === "escalated") return null;

  // Don't re-escalate within the same request cycle
  if (ctx._escalationHandled) return null;
  ctx._escalationHandled = true;

  const customKeywords = workspace.guardrail_config?.escalation_keywords;
  const expandedCustom = customKeywords ? expandEscalationKeywords(customKeywords) : [];
  const keywords = [...new Set([...DEFAULT_KEYWORDS, ...expandedCustom])];
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
  const alertPhone = notifPref?.whatsapp_alert_number || workspace.owner_personal_phone || null;
  if (alertPhone) {
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
          body: JSON.stringify({ phone: alertPhone, message: alertMsg }),
        });
      }
    } catch (e: any) {
      console.error("[ESCALATION] WhatsApp alert error:", e.message);
    }
  }

  return workspace.guardrail_config?.handoff_message
    ?? "I've notified our team and a human will get back to you shortly.";
}

