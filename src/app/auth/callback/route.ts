import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/onboarding"

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=No code provided`)
  }

  const supabaseCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const workspaceId = data.user.app_metadata?.workspace_id
  const redirectTo = workspaceId ? "/inbox" : next
  const response = NextResponse.redirect(`${origin}${redirectTo}`)

  for (const cookie of supabaseCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }

  return response
}
