import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseClient, supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, getToken } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use Clerk-authenticated Supabase client for validation, service role for operations
    const supabase = supabaseAdmin || createClerkSupabaseClient(getToken)
    const { action, recipe_id, estimated_time, total_steps, device_type } = await request.json()

    if (action === 'start') {
      // Create session data with proper structure
      const sessionData = {
        recipe_id,
        user_id: userId, // This must match the authenticated user
        estimated_time: estimated_time || 0,
        total_steps: total_steps || 0,
        steps_completed: 0,
        features_used: {},
        session_data: {
          device_type: device_type || 'unknown',
          start_time: new Date().toISOString(),
        },
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: session, error } = await supabase
        .from('cooking_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) {
        console.error('Database error creating session:', error)
        // Return more specific error information for debugging
        return NextResponse.json(
          { 
            error: 'Failed to create cooking session', 
            details: error.message,
            code: error.code 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(session)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Sessions API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process session request', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { userId, getToken } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use Clerk-authenticated Supabase client for validation, service role for operations
    const supabase = supabaseAdmin || createClerkSupabaseClient(getToken)
    const { session_id, updates } = await request.json()

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // RLS policy will ensure user can only update their own sessions
    const { data, error } = await supabase
      .from('cooking_sessions')
      .update(updateData)
      .eq('id', session_id)
      .eq('user_id', userId) // Double-check user ownership
      .select()
      .single()

    if (error) {
      console.error('Database error updating session:', error)
      return NextResponse.json(
        { 
          error: 'Failed to update cooking session', 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Sessions Update API Error:', error)
    return NextResponse.json(
      { error: 'Failed to update session', details: error.message },
      { status: 500 }
    )
  }
}