import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/gowa";
import { sendEmail } from "@/lib/mail";

const internalSecret = process.env.INTERNAL_CRON_SECRET;
if (!internalSecret) {
  console.error("[NOTIFY_LOW_CREDITS] INTERNAL_CRON_SECRET is not set");
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace_id, owner_email, owner_phone } = await req.json();
    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const notificationId = crypto.randomUUID();

    const { error: notifError } = await (admin as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from("notifications")
      .insert({
        id: notificationId,
        workspace_id,
        title: "Credits Exhausted",
        message: "Your workspace has run out of credits. Customer messages are being blocked. Upgrade your plan to continue serving customers.",
        type: "warning",
        link: "/settings/billing",
        created_at: new Date().toISOString(),
      });

    if (notifError) {
      console.error("[NOTIFY_LOW_CREDITS] Failed to insert notification:", notifError.message);
    }

    const results: Record<string, string> = {};

    if (owner_email) {
      const { error: emailErr } = await sendEmail({
        to: owner_email,
        subject: "FlowCore — Credits Exhausted",
        html: `
          <h2>Your workspace has run out of credits</h2>
          <p>Customer messages are currently being blocked until credits are restored.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://flowcore.ai"}/settings/billing" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Upgrade Now</a></p>
          <p style="margin-top:24px;font-size:13px;color:#666;">FlowCore AI Customer Service</p>
        `,
      });
      results.email = emailErr ? "failed" : "sent";
      if (emailErr) console.error("[NOTIFY_LOW_CREDITS] Email failed:", (emailErr as Error)?.message || emailErr);
    }

    if (owner_phone) {
      try {
        await sendWhatsAppText(
          workspace_id,
          owner_phone,
          "⚠️ Your FlowCore workspace has run out of credits. Customer messages are being blocked. Upgrade your plan at flowcore.ai/settings/billing"
        );
        results.whatsapp = "sent";
      } catch (waErr: unknown) {
        console.error("[NOTIFY_LOW_CREDITS] WhatsApp failed:", waErr instanceof Error ? waErr.message : waErr);
        results.whatsapp = "failed";
      }
    }

    return NextResponse.json({ success: true, notification_id: notificationId, results });
  } catch (err: unknown) {
    console.error("[NOTIFY_LOW_CREDITS] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
