"use client"

import dynamic from 'next/dynamic'

// Lazy load line chart components
const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { 
    loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />,
    ssr: false
  }
)

const Line = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Line })),
  { ssr: false }
)

const XAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.XAxis })),
  { ssr: false }
)

const YAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.YAxis })),
  { ssr: false }
)

const Tooltip = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Tooltip })),
  { ssr: false }
)

const Legend = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Legend })),
  { ssr: false }
)

const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
)

export function LazyLineChart({ data, dataKey = 'value', xAxisKey = 'name', stroke = '#f97316' }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={dataKey} stroke={stroke} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}