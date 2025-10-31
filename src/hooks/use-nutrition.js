"use client"

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { showToast } from '@/lib/toast'

export function useNutrition(recipeId) {
  const queryClient = useQueryClient()

  // Query for getting nutrition data
  const {
    data: nutrition,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['nutrition', recipeId],
    queryFn: async () => {
      if (!recipeId) return null
      
      const response = await fetch(`/api/nutrition?recipeId=${recipeId}`)
      if (!response.ok) {
        if (response.status === 404) {
          return null // No nutrition data exists yet
        }
        throw new Error('Failed to fetch nutrition data')
      }
      const data = await response.json()
      return data.nutrition
    },
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  })

  // Mutation for analyzing nutrition
  const analyzeMutation = useMutation({
    mutationFn: async ({ recipeId, forceRefresh = false }) => {
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, forceRefresh })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze nutrition')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['nutrition', recipeId], data.nutrition)
      showToast.success('Nutrition Analysis Complete', 'Recipe nutrition data has been analyzed')
    },
    onError: (error) => {
      showToast.error('Analysis Failed', error.message)
    }
  })

  const analyzeNutrition = useCallback((forceRefresh = false) => {
    if (!recipeId) return
    analyzeMutation.mutate({ recipeId, forceRefresh })
  }, [recipeId, analyzeMutation])

  return {
    nutrition,
    isLoading: isLoading || analyzeMutation.isPending,
    error,
    hasNutrition: !!nutrition,
    analyzeNutrition,
    isAnalyzing: analyzeMutation.isPending,
    refetch
  }
}

export function useNutritionLabel(nutritionData) {
  const [nutritionLabel, setNutritionLabel] = useState(null)

  useEffect(() => {
    if (nutritionData) {
      const label = {
        servingSize: `1 serving`,
        calories: nutritionData.nutrition_data?.calories || 0,
        totalFat: { 
          value: nutritionData.nutrition_data?.fat || 0, 
          dailyValue: Math.round(((nutritionData.nutrition_data?.fat || 0) / 65) * 100) 
        },
        saturatedFat: { value: 0, dailyValue: 0 }, // Can be added later
        cholesterol: { 
          value: nutritionData.nutrition_data?.cholesterol || 0, 
          dailyValue: Math.round(((nutritionData.nutrition_data?.cholesterol || 0) / 300) * 100) 
        },
        sodium: { 
          value: nutritionData.nutrition_data?.sodium || 0, 
          dailyValue: Math.round(((nutritionData.nutrition_data?.sodium || 0) / 2300) * 100) 
        },
        totalCarbs: { 
          value: nutritionData.nutrition_data?.carbs || 0, 
          dailyValue: Math.round(((nutritionData.nutrition_data?.carbs || 0) / 300) * 100) 
        },
        dietaryFiber: { 
          value: nutritionData.nutrition_data?.fiber || 0, 
          dailyValue: Math.round(((nutritionData.nutrition_data?.fiber || 0) / 25) * 100) 
        },
        sugars: nutritionData.nutrition_data?.sugar || 0,
        protein: { 
          value: nutritionData.nutrition_data?.protein || 0, 
          dailyValue: Math.round(((nutritionData.nutrition_data?.protein || 0) / 50) * 100) 
        }
      }
      setNutritionLabel(label)
    }
  }, [nutritionData])

  return nutritionLabel
}

export function useMealPlanNutrition(recipes) {
  const [aggregatedNutrition, setAggregatedNutrition] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateMealPlanNutrition = useCallback(async () => {
    if (!recipes || recipes.length === 0) return

    setIsCalculating(true)
    try {
      // Get nutrition data for all recipes
      const nutritionPromises = recipes.map(recipe =>
        fetch(`/api/nutrition?recipeId=${recipe.id}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )

      const nutritionResults = await Promise.all(nutritionPromises)
      const validNutrition = nutritionResults
        .filter(result => result?.nutrition)
        .map(result => result.nutrition)

      if (validNutrition.length > 0) {
        // Aggregate nutrition data
        const totals = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sodium: 0
        }

        validNutrition.forEach(nutrition => {
          if (nutrition.nutrition_data) {
            totals.calories += nutrition.nutrition_data.calories || 0
            totals.protein += nutrition.nutrition_data.protein || 0
            totals.carbs += nutrition.nutrition_data.carbs || 0
            totals.fat += nutrition.nutrition_data.fat || 0
            totals.fiber += nutrition.nutrition_data.fiber || 0
            totals.sodium += nutrition.nutrition_data.sodium || 0
          }
        })

        const averageHealthScore = validNutrition.reduce((sum, n) => sum + (n.health_score || 0), 0) / validNutrition.length
        const allDietaryTags = [...new Set(validNutrition.flatMap(n => n.dietary_tags || []))]

        setAggregatedNutrition({
          totals,
          averageHealthScore: Math.round(averageHealthScore * 10) / 10,
          dietaryTags: allDietaryTags,
          recipeCount: validNutrition.length,
          totalRecipes: recipes.length
        })
      }
    } catch (error) {
      console.error('Failed to calculate meal plan nutrition:', error)
      showToast.error('Calculation Failed', 'Could not calculate meal plan nutrition')
    } finally {
      setIsCalculating(false)
    }
  }, [recipes])

  useEffect(() => {
    calculateMealPlanNutrition()
  }, [calculateMealPlanNutrition])

  return {
    aggregatedNutrition,
    isCalculating,
    recalculate: calculateMealPlanNutrition
  }
}