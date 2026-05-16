"use client"

import { usePathname, useRouter } from "next/navigation"
import { Calendar as CalendarIcon, Users, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface AppointmentsSidebarProps {
  currentView: 'list' | 'calendar'
}

export function AppointmentsSidebar({ currentView }: AppointmentsSidebarProps) {
  const router = useRouter()

  const setView = (view: 'list' | 'calendar') => {
    router.push(`/appointments?view=${view}`)
  }

  return (
    <div className="hidden lg:flex w-64 border-r border-gray-100 bg-white flex-col h-full shrink-0 relative z-40 font-sans">
      <div className="p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Appointments</h2>
        </div>
      </div>

      <div className="px-4 flex-1 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <button 
            onClick={() => setView('list')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all group text-left",
              currentView === 'list' 
                ? "bg-[#c65f39]/5 text-[#c65f39]" 
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Users className={cn(
              "h-4 w-4 transition-colors",
              currentView === 'list' ? "text-[#c65f39]" : "text-gray-400 group-hover:text-gray-600"
            )} />
            <span className="text-[13px] font-semibold tracking-tight">Appointments</span>
          </button>

          <button 
            onClick={() => setView('calendar')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all group text-left",
              currentView === 'calendar'
                ? "bg-[#c65f39]/5 text-[#c65f39]"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <CalendarIcon className={cn(
              "h-4 w-4 transition-colors",
              currentView === 'calendar' ? "text-[#c65f39]" : "text-gray-400 group-hover:text-gray-600"
            )} />
            <span className="text-[13px] font-semibold tracking-tight">Calendar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
