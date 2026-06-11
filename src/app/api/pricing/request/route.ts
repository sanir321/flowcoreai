import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { firstName, lastName, email } = parsed.data;

    await sendEmail({
      to: process.env.SMTP_USER!,
      subject: `New pricing request from ${firstName} ${lastName}`,
      html: `
        <h2>New Pricing Request</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
      `,
    }).catch((e) => console.error("[PRICING_REQUEST] Email notification failed:", e));

    const { error: insertError } = await supabaseAdmin
      .from("pricing_requests")
      .insert({ first_name: firstName, last_name: lastName, email });

    if (insertError) {
      console.error("[PRICING_REQUEST] DB insert error (non-fatal):", insertError);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[PRICING_REQUEST] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
