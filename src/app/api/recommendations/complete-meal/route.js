import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Get complete meal suggestion (appetizer + main + dessert)
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const occasion = searchParams.get('occasion') || 'casual';
    const totalTime = parseInt(searchParams.get('totalTime') || '120');
    const servings = parseInt(searchParams.get('servings') || '4');

    const mealPlan = await RecommendationService.getCompleteMealSuggestion(userId, {
      occasion,
      totalTime,
      servings,
    });

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Complete meal API error:', error);
    return NextResponse.json(
      { error: 'Failed to get meal suggestion' },
      { status: 500 }
    );
  }
}
