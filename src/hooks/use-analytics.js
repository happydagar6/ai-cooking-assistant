import { useState, useEffect, useCallback } from 'react'
import analyticsService from '@/lib/analytics-service'

export function useAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [cookingTimeStats, setCookingTimeStats] = useState(null)
  const [mostUsedFeatures, setMostUsedFeatures] = useState([])
  const [recentSessions, setRecentSessions] = useState([])
  const [favoriteRecipes, setFavoriteRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [
        analyticsData,
        timeStats, 
        features,
        sessions,
        favorites
      ] = await Promise.all([
        analyticsService.getUserAnalytics(),
        analyticsService.getCookingTimeStats(),
        analyticsService.getMostUsedFeatures(),
        analyticsService.getCookingSessionHistory(),
        analyticsService.getFavoriteRecipes()
      ])

      setAnalytics(analyticsData)
      setCookingTimeStats(timeStats)
      setMostUsedFeatures(features)
      setRecentSessions(sessions)
      setFavoriteRecipes(favorites)
    } catch (err) {
      console.error('Failed to load analytics data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    refreshAnalytics()
  }, [refreshAnalytics])

  // Auto-refresh every 30 seconds to get live data
  useEffect(() => {
    const interval = setInterval(refreshAnalytics, 30000)
    return () => clearInterval(interval)
  }, [refreshAnalytics])

  return {
    analytics,
    cookingTimeStats,
    mostUsedFeatures,
    recentSessions,
    favoriteRecipes,
    isLoading,
    error,
    refreshAnalytics
  }
}