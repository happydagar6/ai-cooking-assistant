import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch all notes for a recipe
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

    // Fetch notes for recipe
    const { data: notes, error } = await supabase
      .from('recipe_notes')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipe notes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    console.error('Recipe notes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new note
export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const body = await request.json();
    const { 
      content, 
      noteType = 'general', 
      stepNumber, 
      ingredientIndex,
      isPinned = false,
      isVoiceNote = false 
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create note
    const { data: note, error } = await supabase
      .from('recipe_notes')
      .insert({
        recipe_id: recipeId,
        user_id: userId,
        content: content.trim(),
        note_type: noteType,
        step_number: stepNumber,
        ingredient_index: ingredientIndex,
        is_pinned: isPinned,
        is_voice_note: isVoiceNote
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recipe note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Create recipe note API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
