"use client"

import { motion } from "framer-motion"
import {
  MessageSquare,
  Users,
  Bot,
  AlertTriangle,
  Shield,
  BookOpen,
  Phone,
  Calendar,
  Table,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const InsightsChart = dynamic(() => import("./insights-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full rounded-xl" />
})

interface Metrics {
  messages: number
  messageChange: number
  contacts: number
  contactChange: number
  sessions: number
  sessionChange: number
  autonomyRate: number
  escalations: number
  agents: number
  kbSize: number
  whatsappStatus: string
  googleCalendar: boolean
  googleSheets: boolean
}

interface ChartDataPoint {
  date: string
  inbound: number
  outbound: number
  total: number
}

const TrendBadge = ({ value }: { value: number }) => {
  if (value === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400">
      <Minus size={10} /> No change
    </span>
  )
  const isUp = value > 0
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-[10px] font-medium",
      isUp ? "text-emerald-600" : "text-red-500"
    )}>
      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isUp ? '+' : ''}{value}%
    </span>
  )
}

export function InsightsClient({ metrics, chartData }: { metrics: Metrics, chartData: ChartDataPoint[] }) {
  const kpiCards = [
    {
      label: "Messages",
      value: metrics.messages.toLocaleString(),
      change: metrics.messageChange,
      icon: MessageSquare,
      bg: "bg-gray-50",
    },
    {
      label: "Contacts",
      value: metrics.contacts.toLocaleString(),
      change: metrics.contactChange,
      icon: Users,
      bg: "bg-gray-50",
    },
    {
      label: "Sessions",
      value: metrics.sessions.toLocaleString(),
      change: metrics.sessionChange,
      icon: Bot,
      bg: "bg-gray-50",
    },
    {
      label: "Autonomy Rate",
      value: `${metrics.autonomyRate}%`,
      change: null,
      icon: Shield,
      bg: "bg-emerald-50",
      valueColor: "text-emerald-600",
    },
  ]

  const statusItems = [
    { label: "WhatsApp", connected: metrics.whatsappStatus === 'connected' },
    { label: "Google Calendar", connected: metrics.googleCalendar },
    { label: "Google Sheets", connected: metrics.googleSheets },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Insights</h1>
        <span className="text-[10px] text-gray-400 font-medium">Last 7 days</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpiCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-gray-100 bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", card.bg)}>
                    <card.icon size={14} className="text-gray-600" />
                  </div>
                  <TrendBadge value={card.change ?? 0} />
                </div>
                <p className={cn("text-2xl font-bold tracking-tight", card.valueColor || "text-gray-900")}>{card.value}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[11px] text-gray-500 font-medium">Escalations</span>
              </div>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{metrics.escalations}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className="text-gray-500" />
                <span className="text-[11px] text-gray-500 font-medium">Agents</span>
              </div>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{metrics.agents}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-gray-500" />
                <span className="text-[11px] text-gray-500 font-medium">KB Chunks</span>
              </div>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{metrics.kbSize.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-white">
              <span className="text-[11px] text-gray-500 font-medium block mb-2">Integrations</span>
              <div className="space-y-1.5">
                {statusItems.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-600">{s.label}</span>
                    <span className={cn(
                      "text-[10px] font-semibold",
                      s.connected ? "text-emerald-600" : "text-gray-400"
                    )}>
                      {s.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="p-4 rounded-xl border border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Message Volume</h3>
                <p className="text-[11px] text-gray-500 font-medium">Daily inbound vs outbound</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-gray-900" />
                  <span className="text-[10px] font-medium text-gray-500">Inbound</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#c65f39]" />
                  <span className="text-[10px] font-medium text-gray-500">Outbound</span>
                </div>
              </div>
            </div>
            <InsightsChart data={chartData} />
          </div>
        </div>
      </div>
    </div>
  )
}
