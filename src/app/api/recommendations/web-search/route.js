import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { FireCrawlService } from '@/lib/firecrawl-service';
import { RecipeNormalizationService } from '@/lib/recipe-normalization';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Search web for recipes
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '12');
    const timeLimit = parseInt(searchParams.get('timeLimit') || '0');
    const dietary = searchParams.getAll('dietary') || [];
    const cuisine = searchParams.get('cuisine');

    // Validate query
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query required (min 2 characters)' },
        { status: 400 }
      );
    }

    console.log('[API] Web search request:', { query, limit, timeLimit, dietary, cuisine });

    // Start FireCrawl search
    const searchOptions = {
      limit,
      ...(timeLimit > 0 && { timeLimit }),
      ...(dietary.length > 0 && { dietary }),
      ...(cuisine && { cuisine }),
    };

    const result = await FireCrawlService.searchRecipes(query, searchOptions);

    // Normalize results
    const normalized = await RecipeNormalizationService.normalizeRecipes(result.recipes);

    // Enrich recipes
    const enriched = normalized.map(recipe =>
      RecipeNormalizationService.enrichRecipe(recipe)
    );

    console.log('[API] Web search completed:', { query, resultCount: enriched.length });

    return NextResponse.json({
      recipes: enriched,
      jobId: result.jobId,
      source: 'firecrawl',
      resultCount: enriched.length,
      query,
      filters: {
        timeLimit: timeLimit > 0 ? timeLimit : null,
        dietary: dietary.length > 0 ? dietary : null,
        cuisine,
      },
    });

  } catch (error) {
    console.error('[API] Web search error:', error);
    return NextResponse.json(
      { error: `Web search failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST - Web search with additional options
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { query, limit = 12, timeLimit = 0, dietary = [], cuisine = null } = body;

    // Validate
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query required (min 2 characters)' },
        { status: 400 }
      );
    }

    // Search
    const result = await FireCrawlService.searchRecipes(query, {
      limit,
      ...(timeLimit > 0 && { timeLimit }),
      ...(dietary.length > 0 && { dietary }),
      ...(cuisine && { cuisine }),
    });

    // Normalize
    const normalized = await RecipeNormalizationService.normalizeRecipes(result.recipes);
    const enriched = normalized.map(recipe =>
      RecipeNormalizationService.enrichRecipe(recipe)
    );

    return NextResponse.json({
      recipes: enriched,
      jobId: result.jobId,
      source: 'firecrawl',
      resultCount: enriched.length,
      query,
    });

  } catch (error) {
    console.error('[API] Web search POST error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
