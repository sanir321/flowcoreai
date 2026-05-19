"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Inbox, 
  Bot, 
  BarChart2, 
  Users, 
  BookOpen, 
  Settings, 
  Bell,
  LogOut,
  User as UserIcon,
  Layers,
  Phone,
  CheckCircle2,
  TrendingUp,
  Heart,
  Network,
  Calendar as CalendarIcon,
  Terminal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
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
  { icon: Terminal, href: "/agent-hub/test", label: "Test Chat" },
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="hidden lg:flex w-16 border-r border-gray-100 flex-col items-center bg-transparent shrink-0 font-sans z-[60] py-6">
      {/* Brand Logo - FlowCore Orange */}
      <div className="mb-8">
        <Link href="/" className="h-10 w-10 rounded-xl bg-[#c65f39] flex items-center justify-center shadow-[0_4px_12px_rgba(198,95,57,0.15)] hover:scale-105 transition-transform duration-300 group relative">
          <span className="text-white font-black text-sm tracking-tighter">F</span>
          <div className="absolute -inset-1 rounded-xl border border-[#c65f39]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-4 px-2 items-center w-full mt-4">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link 
              key={idx} 
              href={item.href}
              className={cn(
                "group relative h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-[#c65f39]/10 text-[#c65f39] shadow-sm" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                isActive ? "stroke-[2.5]" : "stroke-[2]"
              )} />
              
              {isActive && (
                <motion.div 
                  layoutId="active-rail"
                  className="absolute -left-2 w-1 h-6 bg-[#c65f39] rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Refined Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-gray-900 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all transform translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[70] shadow-xl shadow-black/5 ring-1 ring-black/5">
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="mt-auto flex flex-col items-center gap-5 px-2 w-full">
         <Link 
           href="/settings" 
           className={cn(
             "h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-300",
             pathname.startsWith('/settings') ? "bg-[#c65f39]/10 text-[#c65f39]" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
           )}
         >
            <Settings className="h-5 w-5 stroke-[2]" />
         </Link>
         
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <div className="relative cursor-pointer group" suppressHydrationWarning>
                  <div className="h-9 w-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-900 text-xs font-black shadow-inner overflow-hidden group-hover:border-[#c65f39]/50 transition-colors">
                     <span className="group-hover:scale-110 transition-transform">{userInitial}</span>
                  </div>
                  {/* Status Dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10b981] border-2 border-white shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
               </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56 ml-2 rounded-2xl border-gray-100 shadow-2xl p-2 font-sans bg-white">
               <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex flex-col space-y-1">
                     <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">Current Identity</p>
                     <p className="text-[10px] text-gray-400 font-medium truncate">{userEmail}</p>
                  </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator className="bg-gray-50 mx-1" />
               <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 focus:bg-gray-50 focus:text-black cursor-pointer group transition-all">
                  <UserIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-[#c65f39]" />
                  <span>Profile Sync</span>
               </DropdownMenuItem>
               <DropdownMenuItem 
                 onClick={handleSignOut}
                 className="rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer group transition-all"
               >
                  <LogOut className="mr-3 h-4 w-4 text-rose-400 group-hover:text-rose-600" />
                   <span>Sign Out</span>
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
    </aside>
  )
}
