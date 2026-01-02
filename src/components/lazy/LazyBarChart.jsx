"use client"

import dynamic from 'next/dynamic'

// Lazy load Recharts components - only loaded when needed
const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { 
    loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />,
    ssr: false
  }
)

const Bar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Bar })),
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

const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
)

export function LazyBarChart({ data, dataKey = 'value', xAxisKey = 'name' }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  )
}