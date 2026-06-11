"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, ShoppingCart, Users, BookOpen, LifeBuoy, 
  Search, CheckCircle2, Clock, MapPin, 
  MessageSquare, History, UserCog, Send, FileText,
  ShieldCheck, ArrowRightLeft, Sparkles
} from "lucide-react"

const TOOL_CATEGORIES = [
  {
    title: "Appointment & Calendar",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    agent: "appointment_booking",
    tools: [
      { name: "check_availability", desc: "Scans Google Calendar for free/busy slots on a specific date.", icon: Search },
      { name: "create_appointment", desc: "Books an appointment, creates Google Meet link, and sends WhatsApp/Email alerts.", icon: CheckCircle2 },
      { name: "update_appointment", desc: "Reschedules existing bookings and syncs changes with Google Calendar.", icon: Clock },
      { name: "cancel_appointment", desc: "Deletes bookings from the database and removes Google Calendar events.", icon: ShieldCheck },
    ]
  },
  {
    title: "Sales & Products",
    icon: ShoppingCart,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    agent: "sales",
    tools: [
      { name: "search_menu", desc: "Fuzzy-search the product database for prices, availability, and categories.", icon: Search },
      { name: "check_stock", desc: "Checks if a specific product is available or in stock by name.", icon: CheckCircle2 },
      { name: "send_catalog", desc: "Sends the full product catalog as a formatted text message via WhatsApp.", icon: Send },
      { name: "send_menu_media", desc: "Sends the business menu (Image or PDF) as a native WhatsApp attachment.", icon: Send },
      { name: "generate_quote", desc: "Generates a formal, time-limited price quote for bulk or custom requests.", icon: FileText },
    ]
  },
  {
    title: "CRM & Lead Management",
    icon: Users,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    agent: "sales",
    tools: [
      { name: "capture_lead", desc: "Automatically saves new customer details for marketing and sales follow-ups.", icon: UserCog },
      { name: "schedule_follow_up", desc: "Schedules automated WhatsApp re-engagement messages after X hours.", icon: MessageSquare },
    ]
  },
  {
    title: "Business Knowledge",
    icon: BookOpen,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    agent: "support",
    tools: [
      { name: "match_kb_chunks", desc: "Semantic search across documentation to answer complex customer questions.", icon: Sparkles },
      { name: "get_business_profile", desc: "Retrieves core info: address, hours, amenities, and service list.", icon: MapPin },
      { name: "get_contact_history", desc: "Retrieves past interactions, appointments, and orders for a specific user.", icon: History },
      { name: "update_contact", desc: "Updates customer names, emails, or phone numbers in the CRM database.", icon: UserCog },
    ]
  },
  {
    title: "System & Support",
    icon: LifeBuoy,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    agent: "support",
    tools: [
      { name: "create_ticket", desc: "Opens a support ticket for issues requiring manual human intervention.", icon: MessageSquare },
      { name: "get_ticket_status", desc: "Provides live updates on the resolution progress of an active ticket.", icon: History },
      { name: "request_handoff", desc: "Instantly transfers a session to a different agent or a human manager.", icon: ArrowRightLeft },
    ]
  }
]

export default function AgentToolsPage() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-orange-50 text-[#c65f39] border-orange-100 rounded-lg px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider">
            Capabilities
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agent Tool Registry</h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          A comprehensive overview of the 19 specialized tools integrated into the FlowCore engine. 
          Each tool is scoped to specific agent types — support, booking, or sales — and can interact with your database, calendar, and external services in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {TOOL_CATEGORIES.map((category, idx) => (
          <motion.section
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className={cn("p-2 rounded-xl", category.bgColor, category.color)}>
                <category.icon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{category.title}</h2>
              <Badge className="ml-auto bg-gray-50 text-gray-400 border-none font-medium">
                {category.tools.length} Tools
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.tools.map((tool) => (
                <Card key={tool.name} className="p-5 border-gray-100 hover:border-orange-200 transition-all hover:shadow-md group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <tool.icon className="w-12 h-12 text-orange-50/50 absolute -top-2 -right-2" />
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <code className="text-[12px] font-mono font-bold text-[#c65f39] bg-orange-50/50 px-2 py-0.5 rounded border border-orange-100/50">
                        {tool.name}
                      </code>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed min-h-[40px]">
                      {tool.desc}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active & Integrated</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  )
}
