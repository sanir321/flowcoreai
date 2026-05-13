"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

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
      
      const isAuthPage = pathname === "/login" || pathname === "/auth/callback"
      const isLandingPage = pathname === "/"
      
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

  // Show premium loader for transition or security check
  if (isLoading && (pathname === "/" || pathname === "/login" || isProtectedRoute)) {
    return (
        <div className="fixed inset-0 bg-[#050505] z-[9999] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-[1.25rem] bg-[#c65f39] flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(198,95,57,0.2)]">
                    <span className="text-white font-black text-lg">F</span>
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
            </div>
        </div>
    )
  }

  // If on protected route but not authorized, return null (waiting for redirect)
  if (isProtectedRoute && !isAuthorized) return null

  return <>{children}</>
}
