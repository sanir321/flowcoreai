"use client"

import { motion } from "framer-motion"
import { 
  Users, 
  TrendingUp, 
  ShieldCheck,
  BarChart3
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

interface ChartDataPoint {
  date: string
  count: number
}

export function InsightsClient({ metrics, chartData }: { metrics: Metrics, chartData: ChartDataPoint[] }) {
  const stats = [
    { label: "AI Resolution Rate", value: `${metrics.conversion_rate}%`, icon: ShieldCheck, color: "text-emerald-500", desc: "Queries resolved without human" },
    { label: "Active Connections", value: metrics.contacts, icon: Users, color: "text-purple-500", desc: "Total customer directory" },
    { label: "Message Volume", value: metrics.messages, icon: BarChart3, color: "text-amber-500", desc: "Total transmissions processed" },
  ]

  return (
    <div className="space-y-10 text-gray-900 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <Card className="p-10 border-gray-100 shadow-sm overflow-hidden bg-white">
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
    </div>
  )
}
