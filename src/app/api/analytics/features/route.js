import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, getToken } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClerkSupabaseClient(getToken)
    const { session_id, feature_name, metadata } = await request.json()

    // Get current session
    const { data: session, error: fetchError } = await supabase
      .from('cooking_sessions')
      .select('features_used')
      .eq('id', session_id)
      .eq('user_id', userId) // Ensure user can only update their own sessions
      .single()

    if (fetchError) throw fetchError

    const currentFeatures = session.features_used || {}
    const featureKey = feature_name.toLowerCase().replace(/\s+/g, '_')
    
    // Increment usage count and add metadata
    currentFeatures[featureKey] = {
      count: (currentFeatures[featureKey]?.count || 0) + 1,
      last_used: new Date().toISOString(),
      metadata: {
        ...(currentFeatures[featureKey]?.metadata || {}),
        ...metadata
      }
    }

    // Update session
    const { data, error } = await supabase
      .from('cooking_sessions')
      .update({ features_used: currentFeatures })
      .eq('id', session_id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)

  } catch (error) {
    console.error('Features API Error:', error)
    return NextResponse.json(
      { error: 'Failed to track feature usage' },
      { status: 500 }
    )
  }
}