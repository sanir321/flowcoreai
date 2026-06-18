"use client"

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function InsightsChart({ data }: { data: { date: string; inbound: number; outbound: number; total: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-sm text-gray-400 font-medium">No activity data for this period.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#d4d4d4"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          dy={8}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#d4d4d4"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            fontSize: '12px',
            padding: '10px 14px',
          }}
          cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
          formatter={(value, name) => [value, name === 'inbound' ? 'Inbound' : 'Outbound']}
        />
        <Area
          type="monotone"
          dataKey="inbound"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#inboundGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="outbound"
          stroke="#22d3ee"
          strokeWidth={2}
          fill="url(#outboundGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
