import { RecipeService } from "@/lib/recipe-service";
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';


// Fetch saved recipes for authenticated user
export async function GET(request) {
    try {
        // Get user from Clerk auth
        const authResult = await auth();
        const userId = authResult?.userId;

        console.log('[GET /api/recipes/saved] Auth check:', userId ? '✅ Authenticated' : '❌ Not authenticated');
        
        if (!userId) {
            console.warn('[GET /api/recipes/saved] No user ID found');
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        console.log('[GET /api/recipes/saved] User:', userId);
        
        // Use service role Supabase client to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Fetch user's recipes with their metadata
        const { data: userRecipes, error: userRecipesError } = await supabase
            .from('user_recipes')
            .select(`
                id,
                recipe_id,
                is_favorite,
                personal_notes,
                rating,
                cook_count,
                last_cooked,
                saved_at,
                recipes (
                    id,
                    title,
                    description,
                    prep_time,
                    cook_time,
                    total_time,
                    servings,
                    difficulty,
                    cuisine_type,
                    dietary_tags,
                    image_url,
                    image_storage_path,
                    image_width,
                    image_height,
                    image_blurhash,
                    ingredients,
                    instructions,
                    nutrition,
                    created_by,
                    is_public,
                    created_at,
                    updated_at
                )
            `)
            .eq('user_id', userId)
            .order('saved_at', { ascending: false });

        if (userRecipesError) {
            console.error('[GET /api/recipes/saved] Query error:', userRecipesError);
            throw userRecipesError;
        }

        if (!userRecipes || userRecipes.length === 0) {
            console.log('[GET /api/recipes/saved] No saved recipes found');
            return NextResponse.json({
                recipes: [],
                count: 0,
            });
        }

        console.log('[GET /api/recipes/saved] Found', userRecipes.length, 'saved recipes');

        // Transform the data to flatten user_recipes data into recipe object
        const recipes = userRecipes
            .filter(ur => ur.recipes) // Ensure recipe data exists
            .map(ur => ({
                ...ur.recipes,
                userRecipeId: ur.id,
                is_favorite: ur.is_favorite,
                personal_notes: ur.personal_notes,
                rating: ur.rating,
                cook_count: ur.cook_count,
                last_cooked: ur.last_cooked,
                saved_at: ur.saved_at,
            }));

        console.log('[GET /api/recipes/saved] ✅ Returning', recipes.length, 'recipes');
        
        return NextResponse.json({
            recipes,
            count: recipes.length,
        });

    } catch (error) {
        console.error('[GET /api/recipes/saved] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch saved recipes: ' + error.message },
            { status: 500 }
        );
    }
}