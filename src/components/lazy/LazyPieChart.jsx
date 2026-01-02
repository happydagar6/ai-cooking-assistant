"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load Recharts components - only loaded when needed
const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />,
    ssr: false
  }
)

const Pie = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Pie })),
  { ssr: false }
)

const Cell = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Cell })),
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

const COLORS = ['#f97316', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#ec4899']

export function LazyPieChart({ data }) {
  return (
    <Suspense fallback={<div className="h-80 bg-gray-100 rounded-lg animate-pulse" />}>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Suspense>
  )
}