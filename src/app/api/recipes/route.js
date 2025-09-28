import { RecipeService } from "@/lib/recipe-service";
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';


// Fetch recipes with optional search and filters
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const cuisine = searchParams.get('cuisine');
        const difficulty = searchParams.get('difficulty');
        const limit = searchParams.get('limit');

        // Get user from Clerk auth
        const { userId } = auth();

        let recipes;
        if(userId){
            recipes = await RecipeService.getUserRecipes(userId, { search });
        } else {
            recipes = await RecipeService.searchPublicRecipes({
                search,
                cuisine,
                difficulty,
                limit: limit ? parseInt(limit) : 50
            })
        }
        return NextResponse.json({ recipes });
    } catch (error) {
        console.error('Recipes API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipes' },
            { status: 500 }
        )
    }
}

// Generate new recipes based on query
export async function POST(request) {
    try {
        const data = await request.json();
        const { query } = data;

        if(!query){
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Get user from Clerk auth
        const { userId } = auth();
        
        // Generate recipes directly (no caching)
        const recipes = await RecipeService.generateRecipes(query, userId);
        
        return NextResponse.json({ recipes });
    } catch (error) {
        console.error('Recipes generation API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recipes' },
            { status: 500 }
        );
    }
}