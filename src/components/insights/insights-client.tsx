"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  MessageSquare, Users, Bot, AlertTriangle, Shield,
  BookOpen, TrendingUp, TrendingDown, Minus,
  Calendar, Sheet, Wifi, WifiOff, Sparkles,
  BarChart3, Activity
} from "lucide-react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const InsightsChart = dynamic(() => import("./insights-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full rounded-2xl" />
})

interface Metrics {
  messages: number; messageChange: number
  contacts: number; contactChange: number
  sessions: number; sessionChange: number
  autonomyRate: number; escalations: number
  agents: number; kbSize: number
  whatsappStatus: string; googleCalendar: boolean; googleSheets: boolean
}

interface ChartDataPoint {
  date: string; inbound: number; outbound: number; total: number
}

const ranges = [
  { key: 7, label: "7 Days" },
  { key: 30, label: "30 Days" },
  { key: 90, label: "90 Days" },
] as const

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${h - (v / max) * h}`).join(" ")
  return (
    <svg viewBox={`0 0 100 ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        points={pts} className="opacity-70" />
      <polyline fill={`url(#grad-${color.replace("#","")})`} stroke="none"
        points={`0,${h} ${pts} 100,${h}`} className="opacity-10" />
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  )
}

const TrendBadge = ({ value }: { value: number }) => {
  if (value === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400">
      <Minus size={10} /> No change
    </span>
  )
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-[10px] font-semibold",
      value > 0 ? "text-emerald-600" : "text-red-500"
    )}>
      {value > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

export function InsightsClient({ allData }: {
  allData: Record<number, { metrics: Metrics; chartData: ChartDataPoint[] }>
}) {
  const [range, setRange] = useState<7 | 30 | 90>(7)
  const data = allData[range]!
  const { metrics, chartData } = data

  const kpiCards = [
    {
      label: "Messages", value: metrics.messages.toLocaleString(),
      change: metrics.messageChange, icon: MessageSquare,
      sparkColor: "#8b5cf6",
    },
    {
      label: "Contacts", value: metrics.contacts.toLocaleString(),
      change: metrics.contactChange, icon: Users,
      sparkColor: "#06b6d4",
    },
    {
      label: "Sessions", value: metrics.sessions.toLocaleString(),
      change: metrics.sessionChange, icon: Activity,
      sparkColor: "#f59e0b",
    },
    {
      label: "Autonomy", value: `${metrics.autonomyRate}%`,
      change: null, icon: Shield,
      sparkColor: "#10b981",
    },
  ]

  const chartSparkData = chartData.map((d: ChartDataPoint) => d.total)

  const secondaryCards = [
    {
      label: "Escalations", value: metrics.escalations, icon: AlertTriangle,
      color: "text-amber-500", bg: "bg-amber-50",
    },
    {
      label: "Active Agents", value: metrics.agents, icon: Bot,
      color: "text-gray-600", bg: "bg-gray-50",
    },
    {
      label: "KB Chunks", value: metrics.kbSize.toLocaleString(), icon: BookOpen,
      color: "text-blue-500", bg: "bg-blue-50",
    },
    {
      label: "AI Coverage", value: metrics.autonomyRate >= 80 ? "High" : metrics.autonomyRate >= 50 ? "Medium" : "Low",
      icon: Sparkles,
      color: metrics.autonomyRate >= 80 ? "text-emerald-500" : metrics.autonomyRate >= 50 ? "text-amber-500" : "text-red-500",
      bg: metrics.autonomyRate >= 80 ? "bg-emerald-50" : metrics.autonomyRate >= 50 ? "bg-amber-50" : "bg-red-50",
    },
  ]

  const integrations = [
    { label: "WhatsApp", connected: metrics.whatsappStatus === 'connected', icon: metrics.whatsappStatus === 'connected' ? Wifi : WifiOff },
    { label: "Google Calendar", connected: metrics.googleCalendar, icon: Calendar },
    { label: "Google Sheets", connected: metrics.googleSheets, icon: Sheet },
  ]

  return (
    <div className="flex flex-col h-full bg-[#fbfbfd]">
      <div className="h-12 px-6 border-b border-gray-100/80 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white shadow-sm">
            <BarChart3 size={14} />
          </div>
          <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Insights</h1>
        </div>
        <div className="flex items-center gap-1 bg-gray-100/80 rounded-lg p-0.5">
          {ranges.map(r => (
            <button key={r.key}
              onClick={() => setRange(r.key as typeof range)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium rounded-md transition-all duration-200",
                range === r.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Top Section: KPIs */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {kpiCards.map((card) => (
              <motion.div key={card.label}
                variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                className="relative p-5 rounded-[24px] bg-white border border-gray-200/60 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("h-10 w-10 rounded-[14px] flex items-center justify-center transition-transform group-hover:scale-105", card.label === "Messages" ? "bg-violet-50 text-violet-600" : card.label === "Contacts" ? "bg-cyan-50 text-cyan-600" : card.label === "Sessions" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
                    <card.icon size={18} />
                  </div>
                  {card.change !== null && <TrendBadge value={card.change} />}
                </div>
                <div>
                  <p className="text-[13px] text-gray-500 font-semibold mb-1">{card.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">{card.value}</p>
                </div>
                <div className="mt-4 -mx-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <Sparkline data={chartSparkData} color={card.sparkColor} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Middle Section: Main Chart & Secondary KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-gray-200/60 shadow-sm flex flex-col"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Message Volume</h3>
                  <p className="text-[13px] text-gray-500 font-medium mt-0.5">Daily inbound vs outbound interactions</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-md bg-violet-500" />
                    <span className="text-[12px] font-semibold text-gray-600">Inbound</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-md bg-cyan-400" />
                    <span className="text-[12px] font-semibold text-gray-600">Outbound</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-[300px]">
                <InsightsChart data={chartData} />
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {secondaryCards.map(card => (
                <div key={card.label} className="p-5 flex-1 rounded-[24px] bg-white border border-gray-200/60 shadow-sm flex items-center justify-between group hover:border-gray-300/80 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-105", card.bg)}>
                      <card.icon size={20} className={card.color} />
                    </div>
                    <div>
                      <p className="text-[13px] text-gray-500 font-semibold mb-0.5">{card.label}</p>
                      <p className={cn("text-xl font-bold tracking-tight", card.color)}>{card.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom Section: Integrations & Health */}
          <motion.div
            className="p-6 rounded-[24px] bg-white border border-gray-200/60 shadow-sm"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">System Integrations</h3>
              <p className="text-[13px] text-gray-500 font-medium mt-0.5">Live status of your connected services</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {integrations.map(s => (
                <div key={s.label} className="flex items-center justify-between p-4 rounded-[18px] bg-gray-50/80 border border-gray-100 group hover:bg-gray-100/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl bg-white shadow-sm", s.connected ? "text-emerald-500" : "text-gray-400")}>
                      <s.icon size={18} />
                    </div>
                    <span className="text-[14px] text-gray-700 font-semibold">{s.label}</span>
                  </div>
                  <div className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", s.connected ? "bg-emerald-100/50 text-emerald-700" : "bg-gray-200/50 text-gray-500")}>
                    {s.connected ? "Active" : "Offline"}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
