import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/gowa";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { getUserWorkspaceId } from "@/lib/workspace-auth";

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

    // Get workspace ID via DB lookup (not stale JWT app_metadata)
    const workspaceId = await getUserWorkspaceId(supabase, user.id);
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

    // Enforce valid state transitions
    const validTransitions: Record<string, string[]> = {
      pending: ["paid", "cancelled"],
      paid: ["fulfilled", "cancelled"],
      fulfilled: ["cancelled"],
      cancelled: [],
    };
    const allowed = validTransitions[existing.status as string] || [];
    if (!allowed.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${existing.status}" to "${nextStatus}"` },
        { status: 409 }
      );
    }

    const isPaidTransition = existing.status === "pending" && nextStatus === "paid";
    const isFulfilledTransition = existing.status === "paid" && nextStatus === "fulfilled";
    const isCancelledTransition = nextStatus === "cancelled" && existing.status !== "cancelled";

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

    // Fire customer WhatsApp notifications on status transitions (non-blocking)
    if (existing.customer_phone) {
      let message = "";
      if (isPaidTransition) {
        message = `Payment of ₹${Number(existing.total ?? 0).toLocaleString()} received for Order ${existing.order_number}. Thank you for your purchase! We'll begin processing your order shortly.`;
      } else if (isFulfilledTransition) {
        message = `Great news! Your Order ${existing.order_number} has been fulfilled. If you have any questions, feel free to reach out. Thank you for choosing us!`;
      } else if (isCancelledTransition) {
        message = `Your Order ${existing.order_number} has been cancelled. If you believe this is a mistake, please contact us for assistance.`;
      }
      if (message) {
        sendWhatsAppText(workspaceId, existing.customer_phone, message).catch((e) => {
          console.error("Failed to send order notification WhatsApp:", e);
        });
      }
    }

    return NextResponse.json({ order: data });
  } catch (e: unknown) {
    console.error("Orders PUT error:", e);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
