import { RecipeService } from "@/lib/recipe-service";
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
    try {
        console.log('Fix missing user_recipes links API called');
        
        // Get user from Clerk auth
        const { userId } = await auth();
        
        if (!userId) {
            console.log('No userId found in auth result');
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        console.log('Fixing missing links for user ID:', userId);
        
        // Fix missing user_recipes entries
        const result = await RecipeService.fixMissingUserRecipeLinks(userId);
        
        console.log('Fix result:', result);
        
        return NextResponse.json({ 
            success: true,
            message: `Fixed ${result.fixed} missing recipe links out of ${result.total} total recipes`,
            ...result
        });
        
    } catch (error) {
        console.error('Fix links API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fix recipe links: ' + error.message },
            { status: 500 }
        );
    }
}