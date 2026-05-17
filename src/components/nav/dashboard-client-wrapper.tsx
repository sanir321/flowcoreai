"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/nav/sidebar"
import { NavigationRail } from "@/components/nav/navigation-rail"
import { CommandPalette } from "@/components/nav/command-palette"
import { PageTransition } from "@/components/ui/page-transition"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Inbox, Bot, Calendar, TrendingUp, BookOpen, Users, ShoppingBag } from "lucide-react"

const MOBILE_NAV = [
  { icon: Inbox, href: "/inbox", label: "Inbox" },
  { icon: Bot, href: "/agent-hub", label: "Agents" },
  { icon: Calendar, href: "/appointments", label: "Bookings" },
  { icon: TrendingUp, href: "/insights", label: "Insights" },
  { icon: Users, href: "/contacts", label: "Contacts" },
  { icon: ShoppingBag, href: "/orders", label: "Orders" },
]

export function DashboardClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isDashboardRoute = useMemo(() => {
    return ['/inbox', '/agent-hub', '/settings', '/contacts', '/knowledge', '/insights', '/appointments', '/ceo', '/orders'].some(r => pathname.startsWith(r))
  }, [pathname])

  const isFullBleed = useMemo(() => {
    const fullBleedRoutes = ['/inbox', '/insights', '/agent-hub', '/ceo']
    return fullBleedRoutes.some(route => pathname.startsWith(route))
  }, [pathname])

  return (
    <div className="flex h-dvh bg-white font-sans text-gray-900 selection:bg-[#c65f39]/10 selection:text-[#c65f39]">
      <CommandPalette />

      {isDashboardRoute && <NavigationRail />}

      <main className={cn(
        "flex-1 flex flex-col min-w-0 bg-white transition-all duration-500 pb-16 lg:pb-0",
        isDashboardRoute ? "border-l border-gray-100" : ""
      )}>
        <div className={cn(
          "h-full w-full",
          !isFullBleed ? "p-4 md:p-6 lg:p-10 overflow-y-auto" : "flex flex-col text-gray-900"
        )}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {isDashboardRoute && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {MOBILE_NAV.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0",
                  isActive ? "text-[#c65f39]" : "text-gray-400"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className="text-[9px] font-bold">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
