import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

/**
 * DEBUG ENDPOINT - Check recommendation system state
 * GET /api/debug/recommendations
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check 1: User preferences
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check 2: Recent recipes count
    const { data: recentRecipes } = await supabase
      .from('recipe_interactions')
      .select('recipe_id')
      .eq('user_id', userId)
      .eq('interaction_type', 'cook')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Check 3: Total recipes in database
    const { count: totalRecipes } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    // Check 4: Recipes with scores
    const { count: recipesWithScores } = await supabase
      .from('recipes')
      .select('id, recipe_scores!inner(id)', { count: 'exact', head: true });

    // Check 5: Sample recipes with time filters (60 min)
    const timeAvailable = 60;
    const { data: sampleRecipes, count: sampleCount } = await supabase
      .from('recipes')
      .select('id, title, prep_time, cook_time, difficulty, cuisine_type, recipe_scores(popularity_score, quality_score)', { count: 'exact' })
      .lte('prep_time', Math.floor(timeAvailable * 0.4))
      .lte('cook_time', Math.floor(timeAvailable * 0.6))
      .limit(5);

    return NextResponse.json({
      userId,
      userPreferences: userPrefs,
      recentRecipesCount: recentRecipes?.length || 0,
      recentRecipeIds: recentRecipes?.map(r => r.recipe_id) || [],
      database: {
        totalRecipes: totalRecipes || 0,
        recipesWithScores: recipesWithScores || 0,
        sampleRecipes: {
          count: sampleCount || 0,
          samples: sampleRecipes?.slice(0, 3) || []
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug recommendations error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
