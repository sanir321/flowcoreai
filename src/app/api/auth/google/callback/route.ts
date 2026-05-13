import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Contains workspace_id

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/settings/integrations?error=No code provided`);
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${origin}/api/auth/google/callback`,
        prompt: "consent",
        access_type: "offline",
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || "Failed to exchange code");

    const expiry = new Date(Date.now() + data.expires_in * 1000).toISOString();

    // OPTIMIZATION: Extract email from id_token (JWT) to save a network hop
    let googleEmail = "unknown";
    if (data.id_token) {
        try {
            const payload = JSON.parse(atob(data.id_token.split('.')[1]));
            googleEmail = payload.email;
        } catch (e) {
            console.error("Failed to parse id_token:", e);
        }
    }

    await supabaseAdmin
      .from("google_oauth_tokens")
      .upsert({
        workspace_id: state,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expiry: expiry,
        scopes: data.scope.split(" "),
        google_email: googleEmail,
        updated_at: new Date().toISOString(),
      });

    return NextResponse.redirect(`${origin}/settings/integrations?connected=google`);

  } catch (error: any) {
    console.error("Google Callback Error:", error);
    return NextResponse.redirect(`${origin}/settings/integrations?error=Failed to connect Google. Please try again.`);
  }
}
