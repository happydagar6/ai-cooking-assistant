import { NextResponse } from 'next/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Get hybrid recommendations (internal + external)
 * Query params:
 * - type: 'trending' or 'popular'
 * - limit: number of results (default 12)
 * - internal_ratio: 0-100 (default 60)
 * - external_ratio: 0-100 (default 40)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'trending';
    const limit = parseInt(searchParams.get('limit') || '12');
    const internal_ratio = parseInt(searchParams.get('internal_ratio') || '60');
    const external_ratio = 100 - internal_ratio;

    console.log('[Hybrid API]', { type, limit, internal_ratio, external_ratio });

    let recipes = [];

    if (type === 'trending') {
      recipes = await RecommendationService.getHybridTrendingRecipes(limit, {
        internal_ratio,
        external_ratio,
      });
    } else if (type === 'popular') {
      recipes = await RecommendationService.getHybridPopularRecipes(limit, {
        internal_ratio,
        external_ratio,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "trending" or "popular"' },
        { status: 400 }
      );
    }

    // Categorize results
    const internal = recipes.filter(r => !r.isExternal);
    const external = recipes.filter(r => r.isExternal);

    return NextResponse.json({
      recipes,
      stats: {
        total: recipes.length,
        internal: internal.length,
        external: external.length,
        type,
        ratios: {
          internal: internal_ratio,
          external: external_ratio,
        },
      },
      source: 'hybrid',
    });

  } catch (error) {
    console.error('[Hybrid API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
