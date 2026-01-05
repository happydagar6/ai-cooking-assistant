import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch single collection with recipes
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch collection
    const { data: collection, error: collectionError } = await supabase
      .from('recipe_collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Fetch recipes in collection
    const { data: collectionRecipes, error: recipesError } = await supabase
      .from('collection_recipes')
      .select(`
        id,
        position,
        added_at,
        recipes (
          id,
          title,
          description,
          image_url,
          prep_time,
          cook_time,
          servings,
          difficulty,
          cuisine_type,
          dietary_tags
        )
      `)
      .eq('collection_id', id)
      .order('position', { ascending: true });

    if (recipesError) {
      console.error('Error fetching collection recipes:', recipesError);
      return NextResponse.json({ error: recipesError.message }, { status: 500 });
    }

    return NextResponse.json({
      collection,
      recipes: collectionRecipes?.map(cr => ({
        ...cr.recipes,
        collection_recipe_id: cr.id,
        position: cr.position,
        added_at: cr.added_at
      })) || []
    });
  } catch (error) {
    console.error('Get collection API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update collection
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, color, icon } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update collection
    const { data: collection, error } = await supabase
      .from('recipe_collections')
      .update({
        name: name?.trim(),
        description: description?.trim(),
        color,
        icon
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Update collection API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete collection
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Delete collection (cascade will delete collection_recipes)
    const { error } = await supabase
      .from('recipe_collections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting collection:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete collection API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
