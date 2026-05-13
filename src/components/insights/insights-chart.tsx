"use client"

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

export default function InsightsChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
        <p className="text-sm text-gray-400 font-medium">No activity data available for this period.</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c65f39" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#c65f39" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #f1f5f9', 
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: '12px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="messages" 
            stroke="#c65f39" 
            fillOpacity={1} 
            fill="url(#colorMessages)" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#c65f39', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
