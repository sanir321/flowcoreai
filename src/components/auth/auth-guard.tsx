"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const hasCheckedAuth = useRef(false)

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
        if (isProtectedRoute) {
          window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
          return;
        }
      }
      setIsLoading(false);
    }

    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      checkAuth()
    }
  }, [isProtectedRoute])

  if (isLoading && (pathname === "/" || pathname === "/login" || isProtectedRoute)) {
    return null
  }

  // If on protected route but not authorized, return null (waiting for redirect)
  if (isProtectedRoute && !isAuthorized) return null

  return <>{children}</>
}
