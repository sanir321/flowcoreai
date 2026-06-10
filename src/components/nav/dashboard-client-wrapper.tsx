"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { NavigationRail } from "@/components/nav/navigation-rail"
import { CommandPalette } from "@/components/nav/command-palette"
import { PageTransition } from "@/components/ui/page-transition"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Inbox, Bot, Calendar, TrendingUp, BookOpen, Users, Menu, Zap, Settings, Bell, ShoppingCart, ChevronRight, X, Wrench } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const MOBILE_NAV = [
  { icon: Inbox, href: "/inbox", label: "Inbox" },
  { icon: Bot, href: "/agent-hub", label: "Agents" },
  { icon: Calendar, href: "/appointments", label: "Bookings" },
  { icon: TrendingUp, href: "/insights", label: "Insights" },
  { icon: Users, href: "/contacts", label: "Contacts" },
]

const MORE_SECTIONS = [
  {
    label: "Features",
    items: [
      { icon: BookOpen, href: "/knowledge", label: "Knowledge Base" },
      { icon: Zap, href: "/ceo", label: "CEO Analyst" },
      { icon: ShoppingCart, href: "/orders", label: "Orders" },
      { icon: Wrench, href: "/agent-hub/tools", label: "Agent Tools" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: Settings, href: "/settings", label: "Workspace" },
      { icon: Bell, href: "/settings/notifications", label: "Notifications" },
    ],
  },
]

function MobileMoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-0",
            "text-gray-400 hover:text-gray-900"
          )}>
            <Menu className="h-4 w-4" />
            <span className="text-[8px] font-bold">More</span>
          </button>
        }
      />
      <SheetContent side="bottom" className="bg-white border-t border-gray-100 rounded-t-2xl p-0 pt-2 pb-8 font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <span className="text-xs font-semibold text-gray-900">Navigation</span>
          <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        {MORE_SECTIONS.map((section) => (
          <div key={section.label} className="px-4 py-3">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2">{section.label}</span>
            <div className="mt-2 space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                      isActive ? "bg-[#c65f39]/5 text-[#c65f39]" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "stroke-[2.5]")} />
                    <span className="text-xs font-semibold">{item.label}</span>
                    <ChevronRight className="h-3 w-3 ml-auto text-gray-300" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </SheetContent>
    </Sheet>
  )
}

export function DashboardClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isDashboardRoute = useMemo(() => {
    return ['/inbox', '/agent-hub', '/settings', '/contacts', '/knowledge', '/insights', '/appointments', '/orders', '/ceo', '/agent-hub/test', '/agent-hub/tools'].some(r => pathname.startsWith(r))
  }, [pathname])

  const isFullBleed = useMemo(() => {
    const fullBleedRoutes = ['/inbox', '/insights', '/agent-hub', '/ceo', '/agent-hub/test', '/agent-hub/tools']
    return fullBleedRoutes.some(route => pathname.startsWith(route))
  }, [pathname])

  return (
    <div className="flex h-dvh bg-white font-sans text-gray-900 selection:bg-[#c65f39]/10 selection:text-[#c65f39]">
      <CommandPalette />

      {isDashboardRoute && <NavigationRail />}

      <main className={cn(
        "flex-1 flex flex-col min-w-0 bg-white transition-all duration-500 pb-14 lg:pb-0",
        isDashboardRoute ? "border-l border-gray-100" : ""
      )}>
        <div className={cn(
          "h-full w-full",
          !isFullBleed ? "p-3 md:p-4 lg:p-6 overflow-y-auto" : "flex flex-col text-gray-900"
        )}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {isDashboardRoute && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 flex items-center justify-around px-1 py-1.5 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          {MOBILE_NAV.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-0",
                  isActive ? "text-[#c65f39]" : "text-gray-400"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "stroke-[2.5]")} />
                <span className="text-[8px] font-bold">{item.label}</span>
              </Link>
            )
          })}
          <MobileMoreMenu pathname={pathname} />
        </nav>
      )}
    </div>
  )
}
