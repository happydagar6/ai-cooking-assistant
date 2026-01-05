import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Get "What's for Dinner?" recommendations
 * Query params: timeAvailable, mealType, servings
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeAvailable = parseInt(searchParams.get('timeAvailable') || '60');
    const mealType = searchParams.get('mealType') || 'dinner';
    const servings = parseInt(searchParams.get('servings') || '2');

    const recommendations = await RecommendationService.getWhatsForDinner(userId, {
      timeAvailable,
      mealType,
      servings,
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Whats for dinner API error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
