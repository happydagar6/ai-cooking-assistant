import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient, supabaseAdmin } from '@/lib/supabase'

export async function POST(request, { params }) {
  let userId, recipeId
  
  try {
    const { userId: authUserId, getToken } = await auth()
    userId = authUserId
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = supabaseAdmin || createClerkSupabaseClient(getToken)
    const params_data = await params
    recipeId = params_data.recipeId
    
    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    // First, check if user_recipe relation exists
    const { data: existing, error: checkError } = await supabase
      .from('user_recipes')
      .select('id, is_favorite')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existing) {
      // Update existing relation
      const { data, error } = await supabase
        .from('user_recipes')
        .update({ 
          is_favorite: !existing.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({
        success: true,
        is_favorite: data.is_favorite
      })
    } else {
      // Create new relation as favorite with all required fields
      const newUserRecipe = {
        recipe_id: recipeId,
        user_id: userId,
        is_favorite: true,
        personal_notes: null,
        rating: null,
        cook_count: 0,
        last_cooked: null,
        saved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_recipes')
        .insert(newUserRecipe)
        .select()
        .single()

      if (error) {
        console.error('Error creating user_recipe:', error)
        throw error
      }
      
      return NextResponse.json({
        success: true,
        is_favorite: true
      })
    }

  } catch (error) {
    console.error('Toggle Favorite Error:', error)
    console.error('User ID:', userId)
    console.error('Recipe ID:', recipeId)
    return NextResponse.json(
      { 
        error: 'Failed to toggle favorite',
        details: error.message,
        code: error.code,
        userId: userId,
        recipeId: recipeId
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  let userId, recipeId
  
  try {
    const { userId: authUserId, getToken } = await auth()
    userId = authUserId
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = supabaseAdmin || createClerkSupabaseClient(getToken)
    const params_data = await params
    recipeId = params_data.recipeId

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    // Remove favorite (set is_favorite to false)
    const { data: existing, error: checkError } = await supabase
      .from('user_recipes')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existing) {
      const { error } = await supabase
        .from('user_recipes')
        .update({ 
          is_favorite: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      is_favorite: false
    })

  } catch (error) {
    console.error('Remove Favorite Error:', error)
    console.error('User ID:', userId)
    console.error('Recipe ID:', recipeId)
    return NextResponse.json(
      { 
        error: 'Failed to remove favorite',
        details: error.message,
        code: error.code,
        userId: userId,
        recipeId: recipeId
      },
      { status: 500 }
    )
  }
}