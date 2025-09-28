import { RecipeService } from "@/lib/recipe-service";
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';


// Fetch saved recipes for authenticated user
export async function GET(request) {
    try {
        console.log('Saved recipes API called');
        
        // Get user from Clerk auth
        const authResult = await auth();
        console.log('Auth result:', authResult);
        
        const { userId } = authResult;
        
        if (!userId) {
            console.log('No userId found in auth result');
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        console.log('Authenticated user ID:', userId);
        console.log('Fetching saved recipes for user:', userId);
        
        // Use service role Supabase client to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Fetch recipes with user_recipes data joined properly
        const { data: recipesData, error } = await supabase
            .from("recipes")
            .select(`
                *,
                user_recipes!inner (
                    id,
                    is_favorite,
                    personal_notes,
                    rating,
                    cook_count,
                    last_cooked,
                    saved_at
                )
            `)
            .eq("user_recipes.user_id", userId)
            .order("created_at", { ascending: false });
        
        if (error) {
            console.error('Error fetching saved recipes:', error);
            throw error;
        }
        
        console.log('Found recipes:', recipesData?.length || 0);
        
        // Transform data to include user_recipe_data in the main recipe object
        const recipes = recipesData?.map(recipe => ({
            ...recipe,
            // Flatten the user_recipes data (it's an array due to the join, take first item)
            is_favorite: recipe.user_recipes[0]?.is_favorite || false,
            cook_count: recipe.user_recipes[0]?.cook_count || 0,
            personal_notes: recipe.user_recipes[0]?.personal_notes,
            rating: recipe.user_recipes[0]?.rating,
            last_cooked: recipe.user_recipes[0]?.last_cooked,
            user_recipe_id: recipe.user_recipes[0]?.id,
            // Keep the original user_recipes data structure for compatibility
            user_recipe_data: recipe.user_recipes[0] || {
                is_favorite: false,
                cook_count: 0,
                personal_notes: null,
                rating: null,
                last_cooked: null,
                saved_at: recipe.created_at
            }
        })) || [];
        
        // Remove the joined user_recipes array since we've flattened it
        recipes.forEach(recipe => {
            delete recipe.user_recipes;
        });
        
        return NextResponse.json({ recipes });
    } catch (error) {
        console.error('Saved recipes API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch saved recipes: ' + error.message },
            { status: 500 }
        );
    }
}