"use client"

import { useState } from "react"
import { 
  Wrench, 
  ChevronRight, 
  ChevronDown, 
  Search,
  Calendar,
  MessageSquare,
  Bot
} from "lucide-react"
import { cn } from "@/lib/utils"

const TOOL_GROUPS = [
  {
    id: "availability",
    title: "Search and manage availability",
    desc: "AI can check availability, search listings, and help with booking-related queries",
    tools: [
      { name: "find-contact-by-phone", desc: "Look up a contact by their phone number. Generally used when a caller's number is not recognized." }
    ]
  },
  {
    id: "bookings",
    title: "Create and manage bookings",
    desc: "AI can create booking links, schedule appointments, and manage tours",
    tools: [
      { name: "create-booking-link", desc: "Generate a self-service booking link that contacts can use to schedule their own meetings." },
      { name: "get-booking-calendar-availability", desc: "Retrieve available appointment time slots from the scheduling system for a specified agent." },
      { name: "book-appointment", desc: "Schedule an appointment by collecting contact information (name, and at least one of email/phone)." },
      { name: "reschedule-appointment", desc: "Change the date and time of an existing appointment to a new start and end time." },
      { name: "cancel-appointment", desc: "Cancel an existing scheduled appointment using its booking ID." }
    ]
  }
]

export default function AiToolsPage() {
  return (
    <div className="max-w-5xl mx-auto font-sans">
      <header className="mb-10">
        <h1 className="text-sm font-semibold text-gray-900 mb-1">Internal tools</h1>
        <p className="text-xs text-gray-500">FlowCore tools that your AI agent could have access to</p>
      </header>

      <div className="space-y-8">
        {TOOL_GROUPS.map((group) => (
          <div key={group.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
             {/* Group Header */}
             <div className="p-5 border-b border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="space-y-1">
                   <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
                   <p className="text-xs text-gray-500">{group.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[11px] font-medium text-gray-400">{group.tools.length} tools</span>
                   <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
             </div>

             {/* Tools List */}
             <div className="divide-y divide-gray-100">
                {group.tools.map((tool) => (
                  <div key={tool.name} className="p-4 pl-6 flex items-center gap-5 hover:bg-gray-50/50 transition-all cursor-pointer group">
                     <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-gray-900 transition-colors">
                        <Wrench className="h-5 w-5 stroke-[1.5]" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{tool.name}</h4>
                        <p className="text-xs text-gray-500 truncate pr-10">{tool.desc}</p>
                     </div>
                     <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-900 transition-all" />
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
