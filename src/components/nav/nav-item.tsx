"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useRef, useCallback } from "react"

interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  isCollapsed: boolean
  active?: boolean
}

export function NavItem({ icon: Icon, label, href, isCollapsed, active }: NavItemProps) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      router.prefetch(href)
    }, 100)
  }, [router, href])

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <Link 
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      prefetch={false}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
        active 
          ? "bg-gray-50 text-gray-900 shadow-sm" 
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
      )}
    >
      <Icon className={cn(
        "h-4 w-4 shrink-0 transition-transform duration-500",
        active ? "text-[#f9510b] scale-110" : "group-hover:scale-110"
      )} />
      {!isCollapsed && (
        <span className="text-[13px] font-semibold tracking-tight">{label}</span>
      )}
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="absolute left-0 w-1 h-4 bg-[#f9510b] rounded-r-full"
        />
      )}
    </Link>
  )
}
