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
      <aside className="hidden lg:block w-64 border-r border-gray-100 flex flex-col bg-white shrink-0">
        <div className="p-5 border-b border-gray-50">
           <h1 className="text-base font-bold text-gray-900">Settings</h1>
           <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-widest">Configuration</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 group",
                  isActive
                    ? "text-gray-900 bg-gray-100 font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-300 group-hover:text-gray-600"
                )} />
                <span className="flex-1">{item.name}</span>
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#D95E46]" />}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
