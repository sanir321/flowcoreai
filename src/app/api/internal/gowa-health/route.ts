import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDevices } from "@/lib/gowa";

// Protected internal route for pg_cron / Vercel Cron Jobs
export async function GET(req: NextRequest) {
  try {
    // Auth: verify Bearer token against INTERNAL_CRON_SECRET
    // NOTE: x-vercel-cron header is NOT trusted for auth (any client can set it)
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Refresh GoWA Statuses
    const devices = await getDevices();
    for (const device of devices) {
      await supabaseAdmin
        .from("gowa_sessions")
        .update({ 
          status: device.state,
          phone_jid: device.phone,
          last_seen_at: new Date().toISOString()
        })
        .eq("gowa_session_id", device.id);
    }

    // 2. Escalation Nudges
    const { data: pendingEscalations } = await supabaseAdmin
        .from("escalation_logs")
        .select("*")
        .eq("status", "open")
        .is("notification_sent", false)
        .is("deleted_at", null)
        .lt("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 mins old

    if (pendingEscalations && pendingEscalations.length > 0) {
        for (const esc of pendingEscalations) {
            try {
                const { data: workspace } = await supabaseAdmin
                    .from("workspaces")
                    .select("name, owner_id, owner_personal_phone")
                    .eq("id", esc.workspace_id)
                    .single();

                // Check notification preferences
                const { data: notifPref } = await supabaseAdmin
                    .from("workspace_notifications")
                    .select("notification_mode, email_on_escalation, whatsapp_alert_number")
                    .eq("workspace_id", esc.workspace_id)
                    .maybeSingle();

                const notificationMode = notifPref?.notification_mode || "instant";
                const emailEnabled = notifPref?.email_on_escalation !== false;
                const whatsappNumber = notifPref?.whatsapp_alert_number || workspace?.owner_personal_phone || null;

                if (notificationMode !== "instant" || (!emailEnabled && !whatsappNumber)) {
                    await supabaseAdmin.from("escalation_logs").update({ notification_sent: true }).eq("id", esc.id);
                    continue;
                }

                // Fetch customer info from session
                const { data: session } = await supabaseAdmin
                    .from("conversation_sessions")
                    .select("customer_name, contact_id")
                    .eq("id", esc.session_id)
                    .maybeSingle();
                let customerName = session?.customer_name || 'A Customer';
                if (session?.contact_id) {
                    const { data: contact } = await supabaseAdmin
                        .from("contacts")
                        .select("name")
                        .eq("id", session.contact_id)
                        .maybeSingle();
                    if (contact?.name) customerName = contact.name;
                }

                // Send email notification to workspace owner
                if (emailEnabled && workspace?.owner_id) {
                    const { data: owner } = await supabaseAdmin.auth.admin.getUserById(workspace.owner_id);
                    const ownerEmail = owner?.user?.email;
                    if (ownerEmail) {
                        const inboxUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://7flowcore.vercel.app'}/inbox`;
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://7flowcore.vercel.app'}/api/emails/send`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.INTERNAL_CRON_SECRET}` },
                            body: JSON.stringify({
                                to: ownerEmail,
                                subject: `Escalation Alert — ${workspace.name || 'Your Workspace'}`,
                                template: "escalation",
                                data: {
                                    workspaceName: workspace.name || 'Your Workspace',
                                    customerName,
                                    reason: esc.trigger_message || esc.trigger_type || "Customer requested human assistance",
                                    inboxUrl,
                                }
                            }),
                        }).catch(e => console.error(`[GOWA_HEALTH] Email notification failed: ${e.message}`));
                    }
                }

                // Send WhatsApp alert only in instant mode
                if (whatsappNumber && notificationMode === "instant") {
                    try {
                        const { data: device } = await supabaseAdmin
                            .from("gowa_sessions")
                            .select("gowa_session_id")
                            .eq("workspace_id", esc.workspace_id)
                            .eq("status", "connected")
                            .maybeSingle();

                        if (device?.gowa_session_id) {
                            const gowaKey = process.env.GOWA_API_KEY || "";
                            const alertMsg = `🚨 *Escalation Alert*\n\nWorkspace: ${workspace?.name || 'Unknown'}\nCustomer: ${customerName || 'A Customer'}\nReason: ${esc.trigger_message || esc.trigger_type || "Customer requested human assistance"}\n\nView inbox: ${process.env.NEXT_PUBLIC_APP_URL || 'https://7flowcore.vercel.app'}/inbox`;
                            const gowaBase = process.env.GOWA_BASE_URL?.replace(/\/$/, "");
                            await fetch(`${gowaBase}/send/message`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Basic ${btoa(gowaKey)}`,
                                    "X-Device-Id": device.gowa_session_id
                                },
                                body: JSON.stringify({ phone: whatsappNumber, message: alertMsg }),
                            }).catch(e => console.error(`[GOWA_HEALTH] WhatsApp notification failed: ${e.message}`));
                        }
                    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                        console.error("[GOWA_HEALTH] WhatsApp notification error:", e.message);
                    }
                }
                await supabaseAdmin
                    .from("escalation_logs")
                    .update({ notification_sent: true })
                    .eq("id", esc.id);
            } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error(`[GOWA_HEALTH] Failed to process escalation ${esc.id}: ${e.message}`);
            }
        }
    }

    return NextResponse.json({ success: true, devices_checked: devices.length });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Cron Health Error:", error);
    return new Response("Health check failed", { status: 500 });
  }
}
