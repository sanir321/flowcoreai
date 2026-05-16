import { sendEmail } from "@/lib/mail";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { AppointmentConfirmationEmail } from "@/components/emails/appointment-confirmation";
import { EscalationAlertEmail } from "@/components/emails/escalation-alert";
import { WelcomeEmail } from "@/components/emails/welcome";
import { SignInNotificationEmail } from "@/components/emails/sign-in-notification";
import { ReEngagementEmail } from "@/components/emails/re-engagement";
import * as React from "react";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");

    const { to, subject, template, data } = await req.json();

    if (!to || !subject) {
      return NextResponse.json({ error: "Missing required fields (to, subject)" }, { status: 400 });
    }

    console.log(`[EMAIL_API] Sending SMTP email to: ${to}, Template: ${template || 'default'}`);

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
        // Basic HTML fallback
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #c65f39;">${subject}</h2>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
              ${data.message || JSON.stringify(data, null, 2)}
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
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: (result as any)?.messageId });
  } catch (err: any) {
    console.error("[EMAIL_API] Global Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
