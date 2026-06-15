import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("[LOGOUT] Sign out error:", error.message);
    }

    // Clear all auth cookies
    const response = NextResponse.json({ success: true });
    const cookies = req.cookies.getAll();
    cookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    });

    return response;
  } catch (error) {
    console.error("[LOGOUT] Error:", error);
    return NextResponse.json({ success: true }); // Always succeed
  }
}
