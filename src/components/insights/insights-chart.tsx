"use client"

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function InsightsChart({ data }: { data: { date: string; inbound: number; outbound: number; total: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center bg-gray-50/50 rounded-[24px] border border-dashed border-gray-200">
        <p className="text-sm text-gray-400 font-medium">No activity data for this period.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          dy={12}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.04)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            fontSize: '12px',
            padding: '12px 16px',
            fontWeight: 500,
          }}
          cursor={{ stroke: '#e4e4e7', strokeWidth: 1, strokeDasharray: '4 4' }}
          formatter={(value, name) => [value, name === 'inbound' ? 'Inbound' : 'Outbound']}
        />
        <Area
          type="natural"
          dataKey="inbound"
          stroke="#8b5cf6"
          strokeWidth={1.5}
          fill="url(#inboundGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2, style: { filter: 'drop-shadow(0px 0px 8px rgba(139,92,246,0.8))' } }}
          style={{ filter: "drop-shadow(0px 4px 12px rgba(139, 92, 246, 0.35))" }}
        />
        <Area
          type="natural"
          dataKey="outbound"
          stroke="#06b6d4"
          strokeWidth={1.5}
          fill="url(#outboundGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2, style: { filter: 'drop-shadow(0px 0px 8px rgba(6,182,212,0.8))' } }}
          style={{ filter: "drop-shadow(0px 4px 12px rgba(6, 182, 212, 0.35))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
