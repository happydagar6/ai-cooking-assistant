import { NextResponse } from 'next/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Get trending recipes
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    const trendingRecipes = await RecommendationService.getTrendingRecipes(limit);

    return NextResponse.json({ recipes: trendingRecipes });
  } catch (error) {
    console.error('Trending recipes API error:', error);
    return NextResponse.json(
      { error: 'Failed to get trending recipes' },
      { status: 500 }
    );
  }
}
