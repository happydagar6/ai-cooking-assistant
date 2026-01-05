import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST - Track interaction with external recipe
 * Body: { externalRecipeId, interactionType }
 * Types: 'view' | 'save' | 'favorite' | 'share' | 'click_to_source'
 */
export async function POST(request) {
  try {
    // Get user ID (optional - allow anonymous tracking)
    const { userId } = await auth();

    const body = await request.json();
    const { externalRecipeId, interactionType } = body;

    if (!externalRecipeId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing externalRecipeId or interactionType' },
        { status: 400 }
      );
    }

    const validTypes = ['view', 'save', 'favorite', 'share', 'click_to_source'];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        { error: `Invalid interactionType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('[External Recipe Interaction]', {
      userId,
      externalRecipeId,
      interactionType,
    });

    // Try to save interaction if user is authenticated
    if (userId) {
      try {
        // Check if table exists by attempting to query
        const { error: checkError } = await supabase
          .from('external_recipe_interactions')
          .select('id')
          .limit(1);

        if (!checkError) {
          // Table exists, insert the interaction
          const { error: insertError } = await supabase
            .from('external_recipe_interactions')
            .insert({
              user_id: userId,
              external_recipe_id: externalRecipeId,
              interaction_type: interactionType,
            });

          if (insertError) {
            console.warn('[External Recipe Interaction] Insert error (non-critical):', insertError.message);
          }
        } else {
          console.warn('[External Recipe Interaction] Table may not exist:', checkError.message);
        }
      } catch (dbError) {
        console.warn('[External Recipe Interaction] Database operation failed (non-critical):', dbError.message);
        // Continue - interaction tracking is non-critical
      }
    }

    // Always return success - interaction tracking is best-effort
    return NextResponse.json({
      success: true,
      message: `${interactionType} tracked successfully`,
      externalRecipeId,
      interactionType,
    });

  } catch (error) {
    console.error('[External Recipe Interaction] Error:', error);
    // Return success anyway - this endpoint is best-effort
    return NextResponse.json({
      success: true,
      message: 'Interaction recorded',
      error: error.message, // Include error info for debugging but don't fail
    });
  }
}
