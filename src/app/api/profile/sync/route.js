import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase client with service role for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { userId, email, fullName, avatarUrl } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json(
          { error: 'Failed to create profile: ' + error.message },
          { status: 500 }
        )
      }

      console.log('Profile created successfully:', data)
      return NextResponse.json({ 
        success: true, 
        message: 'Profile created successfully',
        profile: data 
      })
    } else {
      // Update existing profile with latest data from Clerk
      const { data, error } = await supabase
        .from('profiles')
        .update({
          email: email,
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json(
          { error: 'Failed to update profile: ' + error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Profile updated successfully',
        profile: data 
      })
    }
  } catch (error) {
    console.error('Profile sync API Error:', error)
    return NextResponse.json(
      { error: 'Failed to sync profile: ' + error.message },
      { status: 500 }
    )
  }
}