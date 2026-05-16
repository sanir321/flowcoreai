import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDevices } from "@/lib/gowa";

// Protected internal route for pg_cron / Vercel Cron Jobs
export async function GET(req: NextRequest) {
  try {
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    const authHeader = req.headers.get("Authorization");
    const isValidToken = authHeader === `Bearer ${process.env.INTERNAL_CRON_SECRET}`;
    if (!isVercelCron && !isValidToken) {
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
        .lt("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 mins old

    if (pendingEscalations && pendingEscalations.length > 0) {
        console.log(`[GOWA_HEALTH] Processing ${pendingEscalations.length} pending escalation(s)`);
        for (const esc of pendingEscalations) {
            try {
                const { data: workspace } = await supabaseAdmin
                    .from("workspaces")
                    .select("owner_id")
                    .eq("id", esc.workspace_id)
                    .single();

                if (workspace?.owner_id) {
                    const { data: owner } = await supabaseAdmin.auth.admin.getUserById(workspace.owner_id);
                    const ownerEmail = owner?.user?.email;
                    if (ownerEmail) {
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                to: ownerEmail,
                                subject: "Escalation Alert — Action Required",
                                template: "escalation",
                                data: {
                                    workspaceName: esc.workspace_id,
                                    triggerType: esc.trigger_type,
                                    triggerMessage: esc.trigger_message || "Customer requested human assistance",
                                }
                            }),
                        }).catch(e => console.error(`[GOWA_HEALTH] Email notification failed: ${e.message}`));
                    }
                }
                await supabaseAdmin
                    .from("escalation_logs")
                    .update({ notification_sent: true })
                    .eq("id", esc.id);
            } catch (e: any) {
                console.error(`[GOWA_HEALTH] Failed to process escalation ${esc.id}: ${e.message}`);
            }
        }
    }

    return NextResponse.json({ success: true, devices_checked: devices.length });

  } catch (error: any) {
    console.error("Cron Health Error:", error);
    return new Response("Health check failed", { status: 500 });
  }
}
