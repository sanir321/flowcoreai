import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "paid", "delivered", "cancelled"]),
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

    const { data, error } = await supabase
      .from("orders")
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (e: any) {
    console.error("Orders PUT error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
