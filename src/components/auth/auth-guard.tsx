"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname, useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const dashboardRoutes = [
    "/inbox",
    "/agent-hub",
    "/knowledge",
    "/contacts",
    "/settings",
    "/insights",
    "/onboarding"
  ]
  const isProtectedRoute = dashboardRoutes.some(route => pathname.startsWith(route))

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        // If NO user and trying to access protected routes, FORCE login
        if (isProtectedRoute) {
          // Use window.location to force a full page reload to the login page
          window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
          return;
        }
      }
      setIsLoading(false);
    }

    checkAuth()
  }, [pathname, router, supabase, isProtectedRoute])

  if (isLoading && (pathname === "/" || pathname === "/login" || isProtectedRoute)) {
    return null
  }

  // If on protected route but not authorized, return null (waiting for redirect)
  if (isProtectedRoute && !isAuthorized) return null

  return <>{children}</>
}
