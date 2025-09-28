import { useState, useEffect, useCallback } from 'react'
import analyticsService from '@/lib/analytics-service'

// Global state for favorites to sync across components
let globalFavoritesState = new Set()
let globalListeners = new Set()

const notifyListeners = () => {
  globalListeners.forEach(listener => listener(globalFavoritesState))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set(globalFavoritesState))
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (newFavorites) => {
      setFavorites(new Set(newFavorites))
    }
    globalListeners.add(listener)

    return () => {
      globalListeners.delete(listener)
    }
  }, [])

  const refreshFavorites = useCallback(async () => {
    setIsLoading(true)
    try {
      const favoritesData = await analyticsService.getFavoriteRecipes()
      const favoriteIds = new Set(favoritesData.map(recipe => recipe.id))
      
      globalFavoritesState = favoriteIds
      notifyListeners()
    } catch (error) {
      console.error('Failed to refresh favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleFavorite = useCallback(async (recipeId) => {
    try {
      const result = await analyticsService.toggleFavorite(recipeId)
      
      if (result.is_favorite) {
        globalFavoritesState.add(recipeId)
      } else {
        globalFavoritesState.delete(recipeId)
      }
      
      notifyListeners()
      return result.is_favorite
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      throw error
    }
  }, [])

  const isFavorite = useCallback((recipeId) => {
    return favorites.has(recipeId)
  }, [favorites])

  // Initialize favorites on first load
  useEffect(() => {
    refreshFavorites()
  }, [refreshFavorites])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    refreshFavorites,
    isLoading
  }
}