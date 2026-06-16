import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response("Missing Supabase credentials", { status: 500 });
    }

    const resp = await fetch(`${supabaseUrl}/functions/v1/extract-business-profile`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "batch" }),
    });

    const data = await resp.json();
    return NextResponse.json({ success: true, result: data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[REFRESH_BP] Error:", error.message);
    return new Response("Refresh failed", { status: 500 });
  }
}
