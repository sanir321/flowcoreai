import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"

function sanitizeRedirect(next: string | null, origin: string): string {
  if (!next) return "/onboarding"
  // Only allow relative paths starting with / and not containing protocol/double-slash
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("://")) {
    return next
  }
  // Block absolute URLs (open redirect attempt)
  return "/onboarding"
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = sanitizeRedirect(searchParams.get("next"), origin)

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=No code provided`)
  }

  const supabaseCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      },
      cookies: {
        getAll: () => request.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
        setAll: (cookies) => { supabaseCookies.push(...cookies) },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error || !data?.user) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
  }

  const { data: existingWorkspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", data.user.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle()

  let redirectTo = next
  if (existingWorkspace) {
    // Check if agents exist — only redirect to inbox if onboarding is complete
    const { data: agents } = await supabase
      .from("workspace_agents")
      .select("id")
      .eq("workspace_id", existingWorkspace.id)
      .is("deleted_at", null)
      .limit(1)
    redirectTo = (agents && agents.length > 0) ? "/inbox" : "/onboarding"
  }

  if (!data.user.last_sign_in_at) {
    const username = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User"
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000"
    fetch(`${baseUrl}/api/emails/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTERNAL_CRON_SECRET}`,
      },
      body: JSON.stringify({
        to: data.user.email,
        subject: "New Sign-in detected",
        template: "signin",
        data: { username, loginUrl: `${baseUrl}/login` },
      }),
    }).catch((e) => console.error("Auth email failed:", e))
  }

  const response = NextResponse.redirect(`${origin}${redirectTo}`)

  for (const cookie of supabaseCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }

  return response
}
