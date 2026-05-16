"use client"

import { motion } from "framer-motion"
import { 
  Users, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  Clock,
  ShieldAlert,
  AlertCircle,
  BarChart3,
  Bot
} from "lucide-react"
import { Card } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const InsightsChart = dynamic(() => import("./insights-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-3xl" />
})

interface Metrics {
  messages: number
  contacts: number
  conversion_rate: number
}

interface SystemHealth {
  avg_latency: number
  fallback_rate: number
  block_rate: number
  total_traces: number
}

interface ChartDataPoint {
  date: string
  count: number
}

export function InsightsClient({ metrics, health, chartData }: { metrics: Metrics, health: SystemHealth, chartData: ChartDataPoint[] }) {
  const stats = [
    { label: "AI Resolution Rate", value: `${metrics.conversion_rate}%`, icon: ShieldCheck, color: "text-emerald-500", desc: "Queries resolved without human" },
    { label: "Avg Latency", value: `${health.avg_latency}ms`, icon: Clock, color: "text-blue-500", desc: "Network response speed" },
    { label: "Active Connections", value: metrics.contacts, icon: Users, color: "text-purple-500", desc: "Total customer directory" },
    { label: "Message Volume", value: metrics.messages, icon: BarChart3, color: "text-amber-500", desc: "Total transmissions processed" },
  ]

  const healthCards = [
    { label: "Circuit Breaker", value: "Operational", status: "success", icon: Zap },
    { label: "Fallback Rate", value: `${health.fallback_rate}%`, status: health.fallback_rate > 5 ? "warning" : "success", icon: ShieldAlert },
    { label: "Guardrail Blocks", value: `${health.block_rate}%`, status: "success", icon: AlertCircle },
    { label: "Autonomy Score", value: "92.4%", status: "success", icon: Bot },
  ]

  return (
    <div className="space-y-10 text-gray-900 font-sans">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-8 border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className={cn("p-2.5 rounded-xl border border-gray-100", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full">
                    <TrendingUp size={10} />
                    <span>+12.5%</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-4xl font-bold text-gray-900 tracking-tighter">{stat.value}</p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{stat.label}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-6 font-medium border-t border-gray-50 pt-4">{stat.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 p-10 border-gray-100 shadow-sm overflow-hidden bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Traffic Activity</h3>
                    <p className="text-sm text-gray-500 font-medium">Daily message volume across the last 7 days</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#c65f39]" />
                        <span className="text-[10px] font-bold text-gray-600">Messages</span>
                    </div>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <InsightsChart data={chartData} />
            </div>
          </Card>

          {/* System Health Snapshot */}
          <Card className="p-10 border-gray-100 shadow-sm bg-white flex flex-col">
             <div className="space-y-1 mb-10">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-none">System Health</h3>
                <p className="text-sm text-gray-500 font-medium">Telemetry & safety signals</p>
             </div>
             
             <div className="flex-1 grid grid-cols-1 gap-4">
                {healthCards.map((card, i) => (
                    <div key={i} className="p-5 rounded-2xl border border-gray-50 bg-gray-50/50 flex items-center justify-between group hover:border-black/5 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center shadow-sm",
                                card.status === 'success' ? "bg-white text-emerald-500" : "bg-white text-amber-500"
                            )}>
                                <card.icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-gray-600">{card.label}</span>
                        </div>
                        <span className={cn(
                            "text-xs font-bold",
                            card.status === 'success' ? "text-emerald-600" : "text-amber-600"
                        )}>{card.value}</span>
                    </div>
                ))}
             </div>

             <div className="mt-8 pt-8 border-t border-gray-50">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                    <span>Protocol Security</span>
                    <span className="text-emerald-500">Verified</span>
                </div>
             </div>
          </Card>
      </div>
    </div>
  )
}
