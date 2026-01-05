import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET - Fetch user's saved external recipes
 */
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      );
    }

    console.log('[Get Saved External Recipes] User:', userId);

    // Get user's favorite external recipe IDs
    const { data: favorites, error: favError } = await supabase
      .from('user_external_favorites')
      .select('external_recipe_id')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (favError) {
      console.error('[Get Saved External Recipes] Favorite query error:', favError);
      throw favError;
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({
        recipes: [],
        count: 0,
      });
    }

    // Extract recipe IDs
    const recipeIds = favorites.map(fav => fav.external_recipe_id);

    // Fetch full recipe details
    const { data: recipes, error: recipeError } = await supabase
      .from('external_recipes')
      .select('*')
      .in('id', recipeIds)
      .order('created_at', { ascending: false });

    if (recipeError) {
      console.error('[Get Saved External Recipes] Recipe query error:', recipeError);
      throw recipeError;
    }

    console.log('[Get Saved External Recipes] Found', recipes?.length || 0, 'recipes');

    return NextResponse.json({
      recipes: recipes || [],
      count: recipes?.length || 0,
    });

  } catch (error) {
    console.error('[Get Saved External Recipes] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch saved recipes' },
      { status: 500 }
    );
  }
}
