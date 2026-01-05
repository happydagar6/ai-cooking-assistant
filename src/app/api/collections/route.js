import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch all collections for authenticated user
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

    // Fetch collections with recipe count
    const { data: collections, error } = await supabase
      .from('recipe_collections')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Collections API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new collection
export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create collection
    const { data: collection, error } = await supabase
      .from('recipe_collections')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || 'blue',
        icon: icon || 'folder',
        recipe_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      
      // Handle duplicate collection name
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'A collection with this name already exists' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error('Create collection API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
