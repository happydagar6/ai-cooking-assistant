import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const authResult = await auth()
    
    return NextResponse.json({ 
      authenticated: !!authResult.userId,
      userId: authResult.userId,
      debug: authResult
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ 
      error: 'Auth test failed',
      details: error.message 
    })
  }
}