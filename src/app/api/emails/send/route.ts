import { sendEmail } from "@/lib/mail";
import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { AppointmentConfirmationEmail } from "@/components/emails/appointment-confirmation";
import { EscalationAlertEmail } from "@/components/emails/escalation-alert";
import { WelcomeEmail } from "@/components/emails/welcome";
import { SignInNotificationEmail } from "@/components/emails/sign-in-notification";
import { ReEngagementEmail } from "@/components/emails/re-engagement";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import * as React from "react";

const EmailBodySchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  template: z.enum(["escalation", "welcome", "signin", "appointment", "re-engagement"]).optional(),
  data: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const internalSecret = process.env.INTERNAL_CRON_SECRET;
    if (!internalSecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = EmailBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { to, subject: rawSubject, template, data } = parsed.data;
    const subject = rawSubject.replace(/[\r\n]/g, '');

    let emailHtml = "";

    switch (template) {
      case "escalation":
        emailHtml = await render(
          React.createElement(EscalationAlertEmail, {
            workspaceName: data.workspaceName,
            customerName: data.customerName,
            reason: data.reason,
            inboxUrl: data.inboxUrl,
          })
        );
        break;
      case "welcome":
        emailHtml = await render(
          React.createElement(WelcomeEmail, {
            username: data.username,
            loginUrl: data.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL}/login`,
          })
        );
        break;
      case "signin":
        emailHtml = await render(
          React.createElement(SignInNotificationEmail, {
            username: data.username,
            time: data.time || new Date().toLocaleString(),
            device: data.device || "Browser",
          })
        );
        break;
      case "appointment":
        emailHtml = await render(
          React.createElement(AppointmentConfirmationEmail, {
            customerName: data.customerName,
            workspaceName: data.workspaceName,
            service: data.service,
            date: data.date,
            meetLink: data.meetLink,
            appointmentLink: data.appointmentLink,
          })
        );
        break;
      case "re-engagement":
        emailHtml = await render(
          React.createElement(ReEngagementEmail, {
            username: data.username,
            loginUrl: data.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL}/login`,
          })
        );
        break;
      default:
        // Basic HTML fallback — escape user input to prevent XSS
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #c65f39;">${esc(subject)}</h2>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
              ${esc(data.message || JSON.stringify(data, null, 2))}
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Sent via FlowCore Notification Service</p>
          </div>
        `;
    }

    const { data: result, error } = await sendEmail({
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error("[EMAIL_API] SMTP Error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: (result as any)?.messageId }); // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("[EMAIL_API] Global Error:", err.message);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
