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

    if (pendingEscalations) {
        for (const esc of pendingEscalations) {
            // Logic to re-trigger notification (notifyEscalation stub)
        }
    }

    return NextResponse.json({ success: true, devices_checked: devices.length });

  } catch (error: any) {
    console.error("Cron Health Error:", error);
    return new Response("Health check failed", { status: 500 });
  }
}
