"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function InsightsChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-sm text-gray-400 font-medium">No activity data for this period.</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #f1f5f9',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
              padding: '8px 12px'
            }}
            cursor={{ fill: '#f9fafb' }}
          />
          <Bar
            dataKey="inbound"
            fill="#111827"
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="outbound"
            fill="#c65f39"
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
