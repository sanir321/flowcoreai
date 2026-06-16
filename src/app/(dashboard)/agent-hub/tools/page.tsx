"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AssistantsSidebar } from "@/components/nav/assistants-sidebar"
import { 
  Calendar, ShoppingCart, Users, BookOpen, LifeBuoy, 
  Search, CheckCircle2, UserCog, FileText,
  Sparkles, MessageSquare, ArrowRightLeft, History, XCircle
} from "lucide-react"

const TOOL_CATEGORIES = [
  {
    title: "Appointment & Calendar",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    agent: "appointment_booking",
    tools: [
      { name: "manage_appointment", desc: "Consolidated booking tool — check availability, create, reschedule, or cancel appointments with Google Calendar sync. Uses action: 'check' | 'create' | 'update' | 'cancel'.", icon: Calendar },
    ]
  },
  {
    title: "Sales & Products",
    icon: ShoppingCart,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    agent: "sales",
    tools: [
      { name: "manage_catalog", desc: "Fuzzy-search products, check stock, send catalog or menu media via WhatsApp. Uses action: 'search' | 'check_stock' | 'send_catalog' | 'send_media'.", icon: Search },
      { name: "generate_quote", desc: "Generates a formal, time-limited price quote for bulk or custom requests.", icon: FileText },
      { name: "transfer_agent", desc: "Re-routes the conversation to a different agent type (sales, support, booking).", icon: ArrowRightLeft },
    ]
  },
  {
    title: "CRM & Lead Management",
    icon: Users,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    agent: "sales",
    tools: [
      { name: "manage_contact", desc: "Creates, updates, or retrieves customer contact details. Uses action: 'create' | 'update' | 'lookup' | 'history'.", icon: UserCog },
    ]
  },
  {
    title: "Business Knowledge",
    icon: BookOpen,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    agent: "support",
    tools: [
      { name: "search_kb", desc: "Semantic RAG search across uploaded knowledge base documents to answer complex customer questions.", icon: Sparkles },
      { name: "get_business_info", desc: "Retrieves core business info: address, hours, services, amenities, and profile details.", icon: History },
    ]
  },
  {
    title: "System & Support",
    icon: LifeBuoy,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    agent: "support",
    tools: [
      { name: "create_support_ticket", desc: "Opens a support ticket for issues requiring manual human intervention.", icon: MessageSquare },
      { name: "escalate", desc: "Instantly escalates a session to human operators with full conversation context.", icon: XCircle },
      { name: "end_conversation", desc: "Gracefully ends the conversation after resolving the customer's request.", icon: CheckCircle2 },
    ]
  }
]

export default function AgentToolsPage() {
  return (
    <div className="flex min-h-0 flex-1 bg-white font-sans">
      <AssistantsSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto space-y-10 p-10 pb-20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-[#c65f39] border-orange-100 rounded-lg px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider">
                  Capabilities
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agent Tool Registry</h1>
              <p className="text-gray-500 text-sm max-w-2xl">
                A comprehensive overview of the 10 specialized tools integrated into the FlowCore engine. 
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
        </div>
      </div>
    </div>
  )
}
