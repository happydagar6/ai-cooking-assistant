import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RecommendationService } from '@/lib/recommendation-service';

/**
 * GET - Get personalized feed
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const feed = await RecommendationService.getPersonalizedFeed(userId, page, limit);

    return NextResponse.json({ recipes: feed, page, limit });
  } catch (error) {
    console.error('Personalized feed API error:', error);
    return NextResponse.json(
      { error: 'Failed to get personalized feed' },
      { status: 500 }
    );
  }
}
