"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Settings as SettingsIcon,
  Bell,
  Puzzle,
  MessageSquare,
  Globe,
  Zap,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  ClipboardList
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const SETTINGS_NAV = [
  { name: "Workspace", href: "/settings", icon: SettingsIcon },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
  { name: "Integrations", href: "/settings/integrations", icon: Puzzle },
  { name: "WhatsApp Bridge", href: "/settings/whatsapp", icon: MessageSquare },
  { name: "Web Widget", href: "/settings/widget", icon: Globe },
  { name: "Data & Privacy", href: "/settings/data", icon: ShieldCheck },
  { name: "Billing & Credits", href: "/settings/billing", icon: Zap },
  { name: "Menu", href: "/settings/menu", icon: ShoppingBag },
  { name: "Orders", href: "/settings/orders", icon: ClipboardList },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="h-full flex bg-white font-sans overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <aside className="hidden lg:block w-80 border-r border-gray-100 flex flex-col bg-white shrink-0">
        <div className="p-8 border-b border-gray-50">
           <h1 className="text-xl font-bold text-gray-900">Settings</h1>
           <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-widest">Configuration</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm transition-all duration-200 group",
                  isActive
                    ? "text-gray-900 bg-gray-100 font-semibold shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className={cn(
                  "h-4.5 w-4.5 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-300 group-hover:text-gray-600"
                )} />
                <span className="flex-1">{item.name}</span>
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#D95E46]" />}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-6 md:p-10 lg:p-16">
          {children}
        </div>
      </main>
    </div>
  )
}
