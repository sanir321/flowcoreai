import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/gowa";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "paid", "fulfilled", "cancelled"]),
});

export async function PUT(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = user.app_metadata?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const admin = createAdminClient();

    // Read current order to validate transition and capture details for notification
    const { data: existing, error: readError } = await admin
      .from("orders")
      .select("status, order_number, total, customer_phone")
      .eq("id", parsed.data.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (readError || !existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const nextStatus = parsed.data.status;
    const isPaidTransition = existing.status === "pending" && nextStatus === "paid";

    const now = new Date().toISOString();

    const { data, error } = await admin
      .from("orders")
      .update({
        status: nextStatus,
        updated_at: now,
        ...(isPaidTransition ? { payment_verified_at: now } : {})
      })
      .eq("id", parsed.data.id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;

    // Fire customer thank-you WhatsApp on pending → paid (non-blocking)
    if (isPaidTransition && existing.customer_phone) {
      const message = `Payment of ₹${Number(existing.total ?? 0).toLocaleString()} received for Order ${existing.order_number}. Thank you!`;
      sendWhatsAppText(workspaceId, existing.customer_phone, message).catch((e) => {
        console.error("Failed to send thank-you WhatsApp:", e);
      });
    }

    return NextResponse.json({ order: data });
  } catch (e: unknown) {
    console.error("Orders PUT error:", e);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
