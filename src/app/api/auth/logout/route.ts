import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[LOGOUT] Sign out error:", error.message);
    }

    const response = NextResponse.json({ success: true });
    const cookies = req.cookies.getAll();
    cookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    });

    return response;
  } catch (error) {
    console.error("[LOGOUT] Error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
