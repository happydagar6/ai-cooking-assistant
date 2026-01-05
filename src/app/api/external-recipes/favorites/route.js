import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST - Save external recipe as favorite
 * Body: { externalRecipeId, recipe }
 */
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { externalRecipeId, recipe } = body;

    if (!recipe) {
      return NextResponse.json(
        { error: 'recipe is required' },
        { status: 400 }
      );
    }

    // Generate a proper UUID if the ID is not valid UUID format
    if (!externalRecipeId || !isValidUUID(externalRecipeId)) {
      externalRecipeId = generateUUID();
      console.log('[Save External Recipe] Generated new UUID:', externalRecipeId);
    }

    console.log('[Save External Recipe Favorite]', { userId, externalRecipeId, title: recipe.title });

    // Generate content hash for duplicate detection
    const contentHash = generateContentHash(recipe.source_url || recipe.title);

    // First, ensure the external_recipes table has the recipe
    // Using INSERT with ON CONFLICT to handle duplicates properly
    const { error: insertError, data: insertData } = await supabase
      .from('external_recipes')
      .insert({
        id: externalRecipeId,
        title: recipe.title,
        description: recipe.description,
        source_url: recipe.source_url,
        source_domain: recipe.source_domain,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine_type: recipe.cuisine_type,
        dietary_tags: recipe.dietary_tags || [],
        rating: recipe.rating,
        rating_count: recipe.rating_count,
        image_url: recipe.image_url,
        is_verified: false,
        content_hash: contentHash,
        last_scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select();

    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('[Save External Recipe] Insert error:', insertError);
      throw insertError;
    }

    if (insertError && insertError.message.includes('duplicate')) {
      console.log('[Save External Recipe] Recipe already exists');
    }

    // Create favorite record
    const { error: favoriteError } = await supabase
      .from('user_external_favorites')
      .upsert({
        user_id: userId,
        external_recipe_id: externalRecipeId,
        saved_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,external_recipe_id'
      });

    if (favoriteError) {
      console.error('[Save External Recipe Favorite] Favorite error:', favoriteError);
      throw favoriteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe saved to favorites',
      externalRecipeId,
    });

  } catch (error) {
    console.error('[Save External Recipe Favorite] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save favorite' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove external recipe from favorites
 */
export async function DELETE(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const externalRecipeId = searchParams.get('id');

    if (!externalRecipeId) {
      return NextResponse.json(
        { error: 'externalRecipeId is required' },
        { status: 400 }
      );
    }

    console.log('[Remove External Recipe Favorite]', { userId, externalRecipeId });

    const { error } = await supabase
      .from('user_external_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('external_recipe_id', externalRecipeId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe removed from favorites',
      externalRecipeId,
    });

  } catch (error) {
    console.error('[Remove External Recipe Favorite] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check if external recipe is favorited
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

    const { searchParams } = new URL(request.url);
    const externalRecipeId = searchParams.get('id');

    if (!externalRecipeId) {
      return NextResponse.json(
        { error: 'externalRecipeId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_external_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('external_recipe_id', externalRecipeId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      isFavorited: !!data,
      externalRecipeId,
    });

  } catch (error) {
    console.error('[Check External Recipe Favorite] Error:', error);
    return NextResponse.json(
      { isFavorited: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Check if valid UUID format
 */
function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Helper: Generate UUID v4
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Helper: Generate content hash
 */
function generateContentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}