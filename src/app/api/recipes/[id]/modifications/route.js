import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch recipe modification
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recipeId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch active modification
    const { data: modification, error } = await supabase
      .from('recipe_modifications')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching recipe modification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ modification });
  } catch (error) {
    console.error('Recipe modifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new modification
export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const body = await request.json();
    const {
      modifiedIngredients,
      modifiedInstructions,
      servingsOverride,
      prepTimeOverride,
      cookTimeOverride,
      difficultyOverride,
      modificationNotes
    } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get current max version
    const { data: maxVersionData } = await supabase
      .from('recipe_modifications')
      .select('version_number')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = (maxVersionData?.version_number ?? 0) + 1;

    // Deactivate previous modifications
    await supabase
      .from('recipe_modifications')
      .update({ is_active: false })
      .eq('recipe_id', recipeId)
      .eq('user_id', userId);

    // Create new modification
    const { data: modification, error } = await supabase
      .from('recipe_modifications')
      .insert({
        recipe_id: recipeId,
        user_id: userId,
        modified_ingredients: modifiedIngredients,
        modified_instructions: modifiedInstructions,
        servings_override: servingsOverride,
        prep_time_override: prepTimeOverride,
        cook_time_override: cookTimeOverride,
        difficulty_override: difficultyOverride,
        modification_notes: modificationNotes,
        version_number: newVersion,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recipe modification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ modification }, { status: 201 });
  } catch (error) {
    console.error('Create recipe modification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Toggle modification active state
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const { modificationId, isActive } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (isActive) {
      // Deactivate all other modifications
      await supabase
        .from('recipe_modifications')
        .update({ is_active: false })
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .neq('id', modificationId);
    }

    // Update modification
    const { data: modification, error } = await supabase
      .from('recipe_modifications')
      .update({ is_active: isActive })
      .eq('id', modificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating recipe modification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ modification });
  } catch (error) {
    console.error('Update recipe modification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
