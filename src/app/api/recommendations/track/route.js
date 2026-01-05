import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * POST - Track user interaction with a recipe
 * Body: { recipeId, interactionType, metadata }
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId, interactionType, metadata = {} } = body;

    if (!recipeId || !interactionType) {
      return NextResponse.json(
        { error: 'recipeId and interactionType are required' },
        { status: 400 }
      );
    }

    const validTypes = ['view', 'cook', 'save', 'favorite', 'share', 'complete', 'search'];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        { error: `Invalid interactionType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    await RecommendationService.trackInteraction(
      userId,
      recipeId,
      interactionType,
      metadata
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track interaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}
