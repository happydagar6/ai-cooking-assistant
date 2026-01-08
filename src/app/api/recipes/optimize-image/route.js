import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RecipeService } from '@/lib/recipe-service';

/**
 * POST /api/recipes/optimize-image
 * Trigger image optimization for a recipe
 * Useful for manual trigger or retry logic
 */
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      );
    }

    const { recipeId, imageUrl } = await request.json();

    if (!recipeId || !imageUrl) {
      return NextResponse.json(
        { error: 'recipeId and imageUrl are required' },
        { status: 400 }
      );
    }

    console.log('[OptimizeImage] Starting optimization:', { recipeId, imageUrl });

    // Start image optimization in the background
    // Don't wait for it to complete
    RecipeService.optimizeAndStoreRecipeImage(recipeId, imageUrl, userId)
      .catch(error => {
        console.error('[OptimizeImage] Background optimization error:', error);
        // Non-critical, just log
      });

    return NextResponse.json({
      success: true,
      message: 'Image optimization started',
      recipeId
    });

  } catch (error) {
    console.error('[OptimizeImage] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recipes/optimize-image?recipeId=xxx
 * Check image optimization status
 */
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json(
        { error: 'recipeId is required' },
        { status: 400 }
      );
    }

    // In a production app, you could query the image_metadata table
    // to check if optimization is complete
    return NextResponse.json({
      message: 'Use POST endpoint to trigger optimization',
      recipeId
    });

  } catch (error) {
    console.error('[OptimizeImage] GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
