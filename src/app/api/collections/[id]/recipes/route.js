import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// POST - Add recipe to collection
export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: collectionId } = await params;
    const { recipeId, position } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify collection ownership
    const { data: collection } = await supabase
      .from('recipe_collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Get current max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const { data: maxPosData } = await supabase
        .from('collection_recipes')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1)
        .single();
      
      finalPosition = (maxPosData?.position ?? -1) + 1;
    }

    // Add recipe to collection
    const { data: collectionRecipe, error } = await supabase
      .from('collection_recipes')
      .insert({
        collection_id: collectionId,
        recipe_id: recipeId,
        user_id: userId,
        position: finalPosition
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding recipe to collection:', error);
      
      // Handle duplicate
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'Recipe already in this collection' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ collectionRecipe }, { status: 201 });
  } catch (error) {
    console.error('Add recipe to collection API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove recipe from collection
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Remove recipe from collection
    const { error } = await supabase
      .from('collection_recipes')
      .delete()
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing recipe from collection:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove recipe from collection API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Reorder recipes in collection
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: collectionId } = await params;
    const { recipePositions } = await request.json(); // Array of { recipeId, position }

    if (!Array.isArray(recipePositions)) {
      return NextResponse.json({ error: 'Invalid recipe positions' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update positions in batch
    const updates = recipePositions.map(({ recipeId, position }) => 
      supabase
        .from('collection_recipes')
        .update({ position })
        .eq('collection_id', collectionId)
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder recipes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
