import { RecipeService } from "@/lib/recipe-service";
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';


// In-memory cache to prevent duplicate requests within a short timeframe
const recentRequests = new Map();

// Clean up old requests every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    for (const [key, timestamp] of recentRequests.entries()) {
        if (timestamp < fiveMinutesAgo) {
            recentRequests.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Save a new recipe or update existing one
export async function POST(request) {
    try {
        const data = await request.json();
        const { recipe } = data;

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe data is required' }, { status: 400 });
        }

        // Get user from Clerk auth - await the auth call
        const authResult = await auth();
        const { userId } = authResult;
        
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        // Create a unique request key to prevent duplicate saves
        const requestKey = `${userId}-${recipe.title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
        const now = Date.now();
        const lastRequest = recentRequests.get(requestKey);
        
        // ✨ FIX: Reduced from 30 seconds to 5 seconds for better UX
        if (lastRequest && (now - lastRequest) < 5000) {
            return NextResponse.json({ 
                error: 'Recipe was recently saved. Please wait 5 seconds before saving again.' 
            }, { status: 429 });
        }
        
        // Mark this request as recent
        recentRequests.set(requestKey, now);
        
        // Use service role Supabase client to bypass RLS (since we're already authenticated via Clerk)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Use service role Supabase client to save recipe
        const savedRecipe = await RecipeService.saveRecipeWithAuth(recipe, userId, supabase);
        
        return NextResponse.json({ 
            recipe: savedRecipe,
            message: 'Recipe saved successfully' 
        });
    } catch (error) {
        console.error('Recipe save API Error:', error);
        
        // Clear the request cache on error so user can retry
        const requestKey = `${userId}-${recipe.title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
        recentRequests.delete(requestKey);
        
        // Handle specific error types
        if (error.message.includes('already exists')) {
            return NextResponse.json(
                { error: error.message },
                { status: 409 } // Conflict status
            );
        }
        
        if (error.code === '23505') { // PostgreSQL unique violation
            return NextResponse.json(
                { error: 'A recipe with this title already exists. Please choose a different title.' },
                { status: 409 }
            );
        }
        
        return NextResponse.json(
            { error: 'Failed to save recipe: ' + error.message },
            { status: 500 }
        );
    }
}