"use client"

import { lazy, useState } from 'react'
import dynamic from 'next/dynamic'
import React from 'react'
import { useTouchGestures } from "@/hooks/use-touch-gestures"
import { PullToRefreshIndicator } from "@/components/pull-to-refresh"
import { useAuth } from "@/lib/auth-context"
import { showToast } from "@/lib/toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChefHat, Plus, Loader2 } from "lucide-react"
import Link from "next/link"

// ⚡ Lazy load non-critical components
const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics-dashboard').then(mod => ({ 
    default: mod.AnalyticsDashboard 
  })),
  { 
    loading: () => (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false // Don't server render charts (heavy Recharts library)
  }
)

// Placeholder skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-12 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
}

export function DashboardClient() {
  const { user, isLoaded } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Add your refetch logic here
      await new Promise(resolve => setTimeout(resolve, 1000))
      showToast.success("Dashboard refreshed", "Your data is up to date")
    } catch (error) {
      showToast.error("Refresh failed", "Please try again")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isLoaded) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <ChefHat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">Please sign in to view your recipes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PullToRefreshIndicator onRefresh={handleRefresh} />

      {/* Header - Critical path, load immediately */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Recipe Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Smart cooking companion for your kitchen
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      {/* Analytics - Lazy load only when needed */}
      <div id="analytics-section" className="scroll-mt-8">
        <AnalyticsDashboard />
      </div>
    </div>
  )
}
