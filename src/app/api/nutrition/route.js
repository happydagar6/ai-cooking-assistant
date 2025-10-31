import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase'
import { NutritionService } from '@/lib/nutrition-service'
import { RecipeService } from '@/lib/recipe-service'

export async function POST(request) {
  try {
    console.log('🚀 NUTRITION POST ROUTE HIT AT:', new Date().toISOString())
    
    // Check authentication manually since middleware isn't protecting this route
    const { userId, getToken } = await auth()
    
    if (!userId) {
      console.log('❌ No userId, returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', userId)

    const { recipeId, forceRefresh = false } = await request.json()
    console.log('📝 Request data:', { recipeId, forceRefresh })

    if (!recipeId) {
      console.log('❌ No recipeId provided')
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching recipe using RecipeService...')
    // Use RecipeService to get recipe (same as recipes API route)
    const recipe = await RecipeService.getRecipeById(recipeId, userId)

    if (!recipe) {
      console.log('❌ Recipe not found via RecipeService')
      return NextResponse.json(
        { error: `Recipe with ID ${recipeId} not found or you don't have access to it.` },
        { status: 404 }
      )
    }

    console.log('✅ Recipe found:', recipe.title)

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
          console.log('🔄 Using cached nutrition data')
          return NextResponse.json({ 
            nutrition: existingNutrition,
            fromCache: true 
          })
        }
      }
    }

    // Generate new nutrition analysis using AI
    console.log('🤖 Starting AI nutrition analysis...')
    const nutritionData = await NutritionService.analyzeRecipeNutrition(recipe)
    console.log('✅ AI analysis completed:', nutritionData)

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
    } else {
      console.log('💾 Successfully saved nutrition data to database')
    }

    const responseData = { 
      nutrition: savedNutrition || nutritionData,
      isNew: true,
      message: 'AI nutrition analysis completed successfully'
    }

    console.log('✅ Returning AI-generated nutrition data')
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