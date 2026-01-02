import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase'
import { NutritionService } from '@/lib/nutrition-service'
import { RecipeService } from '@/lib/recipe-service'

export async function POST(request) {
  try {
    // Check authentication manually since middleware isn't protecting this route
    const { userId, getToken } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { recipeId, forceRefresh = false } = await request.json()

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    // Use RecipeService to get recipe (same as recipes API route)
    const recipe = await RecipeService.getRecipeById(recipeId, userId)

    if (!recipe) {
      return NextResponse.json(
        { error: `Recipe with ID ${recipeId} not found or you don't have access to it.` },
        { status: 404 }
      )
    }

    // Check if nutrition data already exists and is recent (optional caching)
    const supabase = createClerkSupabaseClient(getToken)
    if (!forceRefresh) {
      const { data: existingNutrition } = await supabase
        .from('recipe_nutrition')
        .select('*')
        .eq('recipe_id', recipeId)
        .single()

      if (existingNutrition) {
        const lastAnalyzed = new Date(existingNutrition.analyzed_at)
        const daysSince = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSince < 7) { // Use cached data if less than 7 days old
          return NextResponse.json({ 
            nutrition: existingNutrition,
            fromCache: true 
          })
        }
      }
    }

    // Generate new nutrition analysis using AI
    const nutritionData = await NutritionService.analyzeRecipeNutrition(recipe)

    // Save to database
    const { data: savedNutrition, error: saveError } = await supabase
      .from('recipe_nutrition')
      .upsert({
        recipe_id: recipeId,
        user_id: userId,
        nutrition_data: nutritionData.nutrition,
        vitamins: nutritionData.vitamins,
        minerals: nutritionData.minerals,
        health_score: nutritionData.healthScore,
        dietary_tags: nutritionData.dietaryTags,
        highlights: nutritionData.highlights,
        concerns: nutritionData.concerns,
        healthy_suggestions: nutritionData.healthySuggestions,
        analyzed_at: new Date().toISOString(),
        servings: recipe.servings || 1
      })
      .select()
      .single()

    if (saveError) {
      console.error('⚠️ Failed to save nutrition data:', saveError)
      // Still return the nutrition data even if saving fails
    }

    const responseData = { 
      nutrition: savedNutrition || nutritionData,
      isNew: true,
      message: 'AI nutrition analysis completed successfully'
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Nutrition analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze nutrition' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    // Return placeholder for now
    return NextResponse.json({ 
      nutrition: null,
      message: 'No nutrition data available yet' 
    })

  } catch (error) {
    console.error('Get nutrition API error:', error)
    return NextResponse.json(
      { error: 'Failed to get nutrition data' },
      { status: 500 }
    )
  }
}