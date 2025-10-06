"use client"

class AnalyticsService {

  // Cooking Session Management
  async startCookingSession(recipeId, estimatedTime, totalSteps) {
    try {
      const response = await fetch('/api/analytics/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          recipe_id: recipeId,
          estimated_time: estimatedTime,
          total_steps: totalSteps,
          device_type: this.getDeviceType(),
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start cooking session')
      }

      return await response.json()
    } catch (error) {
      console.error('Error starting cooking session:', error)
      throw error
    }
  }

  async updateCookingSession(sessionId, updates) {
    try {
      const response = await fetch('/api/analytics/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          updates: {
            ...updates,
            updated_at: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update cooking session')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating cooking session:', error)
      throw error
    }
  }

  async completeCookingSession(sessionId, actualTime, stepsCompleted) {
    try {
      const response = await fetch('/api/analytics/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          updates: {
            completed_at: new Date().toISOString(),
            actual_time: actualTime,
            steps_completed: stepsCompleted
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to complete cooking session')
      }

      return await response.json()
    } catch (error) {
      console.error('Error completing cooking session:', error)
      throw error
    }
  }

  async trackFeatureUsage(sessionId, featureName, metadata = {}) {
    try {
      const response = await fetch('/api/analytics/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          feature_name: featureName,
          metadata
        })
      })

      if (!response.ok) {
        throw new Error('Failed to track feature usage')
      }

      return await response.json()
    } catch (error) {
      console.error('Error tracking feature usage:', error)
      // Don't throw here - feature tracking failures shouldn't break the app
      return null
    }
  }

  // Favorites Management
  async toggleFavorite(recipeId) {
    try {
      const response = await fetch(`/api/favorites/${recipeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      return await response.json()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  async getFavoriteStatus(recipeId) {
    try {
      const response = await fetch(`/api/favorites/${recipeId}`)

      if (!response.ok) {
        if (response.status === 404) {
          return { is_favorite: false }
        }
        throw new Error('Failed to get favorite status')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting favorite status:', error)
      return { is_favorite: false }
    }
  }

  // Analytics Retrieval
  async getUserAnalytics() {
    try {
      const response = await fetch('/api/analytics?type=overview')

      if (!response.ok) {
        throw new Error('Failed to get user analytics')
      }

      const result = await response.json()
      return result.data || this.getDefaultAnalytics()
    } catch (error) {
      console.error('Error getting user analytics:', error)
      return this.getDefaultAnalytics()
    }
  }

  async getCookingSessionHistory(limit = 10) {
    try {
      const response = await fetch(`/api/analytics?type=sessions&limit=${limit}`)

      if (!response.ok) {
        throw new Error('Failed to get cooking session history')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting cooking session history:', error)
      return []
    }
  }

  async getCookingTimeStats() {
    try {
      const response = await fetch('/api/analytics?type=cooking-time')

      if (!response.ok) {
        throw new Error('Failed to get cooking time stats')
      }

      const result = await response.json()
      return result.data || this.getDefaultTimeStats()
    } catch (error) {
      console.error('Error getting cooking time stats:', error)
      return this.getDefaultTimeStats()
    }
  }

  async getMostUsedFeatures() {
    try {
      const response = await fetch('/api/analytics?type=features')

      if (!response.ok) {
        throw new Error('Failed to get most used features')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting most used features:', error)
      return []
    }
  }

  async getFavoriteRecipes() {
    try {
      const response = await fetch('/api/analytics?type=favorites')

      if (!response.ok) {
        throw new Error('Failed to get favorite recipes')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error getting favorite recipes:', error)
      return []
    }
  }

  // Utility methods
  getDeviceType() {
    if (typeof window === 'undefined') return 'unknown'
    
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  formatFeatureName(feature) {
    return feature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  getDefaultAnalytics() {
    return {
      total_recipes_created: 0,
      total_cooking_sessions: 0,
      total_cooking_time: 0,
      favorite_recipes_count: 0,
      most_used_features: {},
      cooking_streak: 0,
      last_cooking_date: null
    }
  }

  getDefaultTimeStats() {
    return {
      total_sessions: 0,
      average_estimated: 0,
      average_actual: 0,
      accuracy_percentage: 0,
      time_saved: 0,
      sessions_on_time: 0
    }
  }
}

const analyticsService = new AnalyticsService()
export default analyticsService