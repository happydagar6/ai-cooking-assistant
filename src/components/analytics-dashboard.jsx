"use client"
import { useAuth } from "@/lib/auth-context";
import { 
  useAnalyticsOverview,
  useAnalyticsCookingTime, 
  useAnalyticsFeatures,
  useAnalyticsSessions,
  useFavoriteRecipes 
} from "@/hooks/use-optimized-queries";

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  Activity,
  ChefHat,
  Clock,
  Heart,
  RefreshCw,
  Target,
  Timer,
  Users,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

// ⚡ Lazy load chart components - only loaded when analytics visible
const LazyBarChart = dynamic(
  () => import('@/components/lazy/LazyBarChart').then(mod => ({ 
    default: mod.LazyBarChart 
  })),
  { 
    loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />,
    ssr: false
  }
)

const LazyPieChart = dynamic(
  () => import('@/components/lazy/LazyPieChart').then(mod => ({ 
    default: mod.LazyPieChart 
  })),
  { 
    loading: () => <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />,
    ssr: false
  }
)

const LazyLineChart = dynamic(
  () => import('@/components/lazy/LazyLineChart').then(mod => ({ 
    default: mod.LazyLineChart 
  })),
  { 
    loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />,
    ssr: false
  }
)

const CHART_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1",
  "#d084d0", "#82d982", "#ffb347", "#87ceeb", "#dda0dd",
]

// ============ LOADING SKELETON COMPONENTS ============
function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-muted rounded w-1/3 mb-1"></div>
          <div className="h-3 bg-muted rounded w-3/4"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      
      {/* Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export function AnalyticsDashboard() {
  // ✨ OPTIMIZED: Get user from auth context
  const { user } = useAuth();
  const userId = user?.id;

  // ✨ OPTIMIZED: Use React Query hooks with caching
  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    refetch: refetchAnalytics 
  } = useAnalyticsOverview(userId);

  const { 
    data: cookingTimeStats, 
    isLoading: cookingTimeLoading 
  } = useAnalyticsCookingTime(userId);

  const { 
    data: mostUsedFeatures, 
    isLoading: featuresLoading 
  } = useAnalyticsFeatures(userId);

  const { 
    data: recentSessions, 
    isLoading: sessionsLoading 
  } = useAnalyticsSessions(userId);

  const { 
    data: favoriteRecipes, 
    isLoading: favoritesLoading 
  } = useFavoriteRecipes(userId);

  // Combined loading and error states
  const isLoading = analyticsLoading;
  const error = analyticsError;

  // Manual refresh function for user-triggered refresh
  const handleRefresh = () => {
    refetchAnalytics();
  }

  // Show loading skeleton only if critical data (analytics) is loading
  const isInitialLoading = isLoading && !analytics

  if (isInitialLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto opacity-50" />
            <p className="mt-4">Failed to load analytics data</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-6">
      {/* Header with refresh button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:gap-4 gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Track your cooking journey
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          <span className="sm:hidden">{isLoading ? 'Loading' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatsCard
          title="Recipes Created"
          value={analytics?.total_recipes_created || 0}
          icon={ChefHat}
          description="Your recipe collection"
          color="text-blue-600"
        />
        
        <StatsCard
          title="Cooking Sessions"
          value={analytics?.total_cooking_sessions || 0}
          icon={Clock}
          description="Times you've cooked"
          color="text-green-600"
        />
        
        <StatsCard
          title="Total Cooking Time"
          value={`${Math.floor((analytics?.total_cooking_time || 0) / 60)}h ${
            (analytics?.total_cooking_time || 0) % 60
          }m`}
          icon={Timer}
          description="Time spent cooking"
          color="text-orange-600"
        />
        
        <StatsCard
          title="Favorite Recipes"
          value={analytics?.total_favorites || 0}
          icon={Heart}
          description="Your starred recipes"
          color="text-red-600"
        />
      </div>

      {/* Detailed Analytics with Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Overview</TabsTrigger>
          <TabsTrigger value="cooking-time" className="text-xs sm:text-sm px-2 sm:px-4">Cooking</TabsTrigger>
          <TabsTrigger value="features" className="hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-4">Features</TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs sm:text-sm px-2 sm:px-4">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
            <CookingStreakCard analytics={analytics} />
            <RecentSessionsCard 
              sessions={recentSessions?.sessions || recentSessions || []} 
              isLoading={sessionsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="cooking-time" className="space-y-4">
          <CookingTimeAnalytics 
            stats={cookingTimeStats?.data || cookingTimeStats} 
            isLoading={cookingTimeLoading}
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <MostUsedFeaturesChart 
            features={mostUsedFeatures?.features || []} 
            isLoading={featuresLoading}
          />
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <FavoriteRecipesGrid 
            recipes={favoriteRecipes?.favorites || favoriteRecipes || []} 
            isLoading={favoritesLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============ SUB COMPONENTS WITH LOADING STATES ============

function StatsCard({ title, value, icon: Icon, description, color }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col items-start space-y-1 sm:space-y-2">
          <Icon className={`h-4 sm:h-5 w-4 sm:w-5 ${color}`} />
          <div className="flex-1 min-w-0 w-full">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-lg sm:text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CookingStreakCard({ analytics }) {
  const streak = analytics?.cooking_streak || 0
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Cooking Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">{streak}</div>
          <p className="text-muted-foreground">
            {streak === 0 ? 'Start cooking to build your streak!' :
             streak === 1 ? 'day with cooking activity' :
             'days with cooking activity'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentSessionsCard({ sessions, isLoading }) {
  if (!sessions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!sessions || sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No cooking sessions yet. Start cooking to see your activity!
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{session.recipes?.title || 'Unknown Recipe'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.started_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">{session.recipes?.difficulty || 'N/A'}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CookingTimeAnalytics({ stats, isLoading }) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cooking Time Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cooking Time Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete some cooking sessions to see time analytics!
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = Object.entries(stats).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    time: value
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Cooking Time Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
          <LazyBarChart data={chartData} xAxisKey="name" dataKey="time" />
        </Suspense>
      </CardContent>
    </Card>
  )
}

function MostUsedFeaturesChart({ features, isLoading }) {
  if (!features) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Used Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-80 bg-muted rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (!features || features.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Used Features</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Use app features to see usage statistics!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Feature Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-80 bg-gray-100 rounded-lg animate-pulse" />}>
          <LazyPieChart data={features} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

function FavoriteRecipesGrid({ recipes, isLoading }) {
  if (!recipes) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!recipes || recipes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Mark recipes as favorites to see them here!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map((recipe) => (
        <Card key={recipe.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              <Badge variant="outline">{recipe.difficulty}</Badge>
            </div>
            <h3 className="font-semibold text-sm mb-2 line-clamp-2">
              {recipe.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {recipe.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{recipe.prep_time + recipe.cook_time}min</span>
              <Users className="h-3 w-3 ml-2" />
              <span>{recipe.servings}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}