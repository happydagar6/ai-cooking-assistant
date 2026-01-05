import { NextResponse } from 'next/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Get popular recipes (all-time)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    const popularRecipes = await RecommendationService.getPopularRecipes(limit);

    return NextResponse.json({ recipes: popularRecipes });
  } catch (error) {
    console.error('Popular recipes API error:', error);
    return NextResponse.json(
      { error: 'Failed to get popular recipes' },
      { status: 500 }
    );
  }
}
