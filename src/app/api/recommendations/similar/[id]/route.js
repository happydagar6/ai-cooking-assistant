import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Get similar recipes
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    const { id: recipeId } = await params;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    const similarRecipes = await RecommendationService.getSimilarRecipes(
      recipeId,
      userId,
      limit
    );

    return NextResponse.json({ recipes: similarRecipes });
  } catch (error) {
    console.error('Similar recipes API error:', error);
    return NextResponse.json(
      { error: 'Failed to get similar recipes' },
      { status: 500 }
    );
  }
}
