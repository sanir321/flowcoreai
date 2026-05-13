"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isCollapsed: boolean
  active?: boolean
}

export function NavItem({ icon: Icon, label, href, isCollapsed, active }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
        active 
          ? "bg-gray-50 text-gray-900 shadow-sm" 
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
      )}
    >
      <Icon className={cn(
        "h-4 w-4 shrink-0 transition-transform duration-500",
        active ? "text-[#c65f39] scale-110" : "group-hover:scale-110"
      )} />
      {!isCollapsed && (
        <span className="text-[13px] font-semibold tracking-tight">{label}</span>
      )}
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="absolute left-0 w-1 h-4 bg-[#c65f39] rounded-r-full"
        />
      )}
    </Link>
  )
}
