import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { randomBytes } from "crypto"

export async function middleware(request: NextRequest) {
  // Generate CSP nonce (base64-encoded random bytes)
  const nonce = randomBytes(16).toString("base64")

  // EMERGENCY 431 GUARD: Clear bloated cookies by setting Max-Age=0
  const requestHeaders = new Headers(request.headers)
  const headerSize = JSON.stringify([...requestHeaders.entries()]).length

  if (headerSize > 12000) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    const allCookies = request.cookies.getAll()
    allCookies.forEach(cookie => {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
    })
    return response
  }

  const url = request.nextUrl.clone()

  const publicRoutes = ["/", "/login", "/faq", "/changelog", "/legal", "/auth/callback"]
  const isPublicRoute = publicRoutes.some(route =>
    route === "/" ? url.pathname === "/" : url.pathname.startsWith(route)
  )

  const dashboardRoutes = [
    "/inbox", "/agent-hub", "/knowledge", "/contacts",
    "/settings", "/insights",
  ]
  const isDashboardRoute = dashboardRoutes.some((route) =>
    url.pathname.startsWith(route)
  )
  const isOnboardingRoute = url.pathname.startsWith("/onboarding")
  const isInternalApiRoute = url.pathname.startsWith("/api/") && 
    !url.pathname.startsWith("/api/widget/") && 
    !url.pathname.startsWith("/api/webhooks/") &&
    !url.pathname.startsWith("/api/internal/") &&
    !url.pathname.startsWith("/api/auth/google/callback")

  let supabaseResponse = NextResponse.next({ request })

  if (isPublicRoute && !isDashboardRoute && !isOnboardingRoute && !isInternalApiRoute) {
    return applySecurityHeaders(supabaseResponse, nonce)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isDashboardRoute || isOnboardingRoute || isInternalApiRoute) {
    if (!user) {
      if (isInternalApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    const workspaceId = user.app_metadata?.workspace_id

    // REDIRECTION LOGIC
    if (isDashboardRoute && !workspaceId) {
      // No workspace found in metadata -> must onboard
      const onboardingUrl = new URL("/onboarding", request.url)
      return NextResponse.redirect(onboardingUrl)
    }

    if (isOnboardingRoute && workspaceId) {
      // Already has a workspace -> skip onboarding
      const dashboardUrl = new URL("/inbox", request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return applySecurityHeaders(supabaseResponse, nonce)
}

function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const headers = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.bluesminds.com https://go-whatsapp-web-multidevice-production-8644.up.railway.app; frame-ancestors 'none'`,
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  // Pass nonce to rendering layer via header
  response.headers.set("x-nonce", nonce);
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
}
