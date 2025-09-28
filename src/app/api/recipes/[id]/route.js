import { RecipeService } from "@/lib/recipe-service";
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';


// Fetch, update, or delete a specific recipe by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        
        // Get authenticated user from Clerk
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        console.log('Fetching recipe:', id, 'for user:', userId);

        const recipe = await RecipeService.getRecipeById(id, userId);

        if(!recipe){
            return NextResponse.json({ error: 'Recipe not found or access denied' }, { status: 404 });
        }

        console.log('Recipe fetched successfully:', recipe.title);
        return NextResponse.json({ recipe });
    } catch (error) {
        console.error('Recipe API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipe: ' + error.message },
            { status: 500 }
        );
    }
}


// Update recipe by ID
export async function PUT(request, { params }) {
    try {
        const { id } = await params; // Await params in Next.js 15
        const data = await request.json();
        const { userId, ...updates} = data;

        if(!userId){
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        
        const recipe = await RecipeService.updateRecipe(id, updates, userId);
        return NextResponse.json({ recipe });
    } catch (error) {
        console.error('Recipe update API Error:', error);
        return NextResponse.json(
            { error: 'Failed to update recipe' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params; // Await params in Next.js 15
        console.log('Delete recipe API called for ID:', id);
        
        // Get user from Clerk auth - await the auth call
        const authResult = await auth();
        console.log('Auth result:', authResult);
        
        const { userId } = authResult;
        
        if (!userId) {
            console.log('No userId found in auth result');
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        console.log('Authenticated user ID:', userId);
        console.log('Deleting recipe ID:', id, 'for user:', userId);

        // Use service role Supabase client to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Delete the recipe - only if it belongs to the authenticated user
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id)
            .eq('created_by', userId);

        if (error) {
            console.error('Error deleting recipe:', error);
            throw error;
        }
        
        console.log('Recipe deleted successfully');
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Recipe delete API Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete recipe: ' + error.message },
            { status: 500 }
        );
    }
}