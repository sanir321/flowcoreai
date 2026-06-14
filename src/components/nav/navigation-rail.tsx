"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Inbox, 
  Bot, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  User as UserIcon,
  TrendingUp,
  Calendar as CalendarIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS = [
  { icon: Inbox, href: "/inbox", label: "Inbox" },
  { icon: Bot, href: "/agent-hub", label: "Agents" },
  { icon: CalendarIcon, href: "/appointments", label: "Appointments" },
  { icon: TrendingUp, href: "/insights", label: "Insights" },
  { icon: BookOpen, href: "/knowledge", label: "Knowledge" },
  { icon: Users, href: "/contacts", label: "Contacts" },
]

export function NavigationRail() {
  const pathname = usePathname()
  const [userInitial, setUserInitial] = useState("U")
  const [userEmail, setUserEmail] = useState("")
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserInitial(user.email.charAt(0).toUpperCase())
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [])

  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handlePrefetch = useCallback((href: string) => {
    if (prefetchTimer.current) clearTimeout(prefetchTimer.current)
    prefetchTimer.current = setTimeout(() => {
      router.prefetch(href)
    }, 100)
  }, [router])

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimer.current) clearTimeout(prefetchTimer.current)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="hidden lg:flex w-14 border-r border-gray-100 flex-col items-center bg-transparent shrink-0 font-sans z-[60] py-4">
      <div className="mb-5">
        <Link href="/" className="h-8 w-8 rounded-lg bg-[#c65f39] flex items-center justify-center shadow-[0_2px_8px_rgba(198,95,57,0.15)] hover:scale-105 transition-transform duration-300 group relative">
          <span className="text-white font-black text-[11px] tracking-tighter">F</span>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-3 items-center w-full">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link 
              key={idx} 
              href={item.href}
              onMouseEnter={() => handlePrefetch(item.href)}
              onMouseLeave={cancelPrefetch}
              prefetch={false}
              className={cn(
                "group relative h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-300",
                isActive 
                  ? "bg-[#c65f39]/10 text-[#c65f39]" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                isActive ? "stroke-[2.5]" : "stroke-[2]"
              )} />
              
              {isActive && (
                <motion.div 
                  layoutId="active-rail"
                  className="absolute -left-2 w-0.5 h-5 bg-[#c65f39] rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className="absolute left-full ml-3 px-2 py-1 rounded-md bg-white border border-gray-100 text-gray-900 text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 pointer-events-none transition-all transform translate-x-[-8px] group-hover:translate-x-0 whitespace-nowrap z-[70] shadow-lg shadow-black/5">
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3 w-full">
         <Link 
            href="/settings"
            onMouseEnter={() => handlePrefetch("/settings")}
            onMouseLeave={cancelPrefetch}
            prefetch={false}
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-300",
              pathname.startsWith('/settings') ? "bg-[#c65f39]/10 text-[#c65f39]" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
            )}
          >
             <Settings className="h-4 w-4" />
          </Link>
         
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <div className="relative cursor-pointer group" suppressHydrationWarning>
                  <div className="h-7 w-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-900 text-[10px] font-black overflow-hidden group-hover:border-[#c65f39]/50 transition-colors">
                     <span>{userInitial}</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#10b981] border-2 border-white" />
               </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48 ml-2 rounded-xl border-gray-100 shadow-lg p-1.5 font-sans bg-white">
               <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-0.5">
                     <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Identity</p>
                     <p className="text-[9px] text-gray-400 font-medium truncate">{userEmail}</p>
                  </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator className="bg-gray-50 mx-1" />
               <DropdownMenuItem onClick={() => router.push("/settings/business-profile")} className="rounded-lg px-3 py-2 text-[10px] font-bold text-gray-700 focus:bg-gray-50 focus:text-black cursor-pointer group transition-all">
                  <UserIcon className="mr-2 h-3.5 w-3.5 text-gray-400" />
                  <span>Business Profile</span>
               </DropdownMenuItem>
               <DropdownMenuItem 
                 onClick={handleSignOut}
                 className="rounded-lg px-3 py-2 text-[10px] font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer group transition-all"
               >
                  <LogOut className="mr-2 h-3.5 w-3.5 text-rose-400" />
                   <span>Sign Out</span>
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
    </aside>
  )
}
