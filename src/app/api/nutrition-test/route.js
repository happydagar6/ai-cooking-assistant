import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('Simple nutrition POST route hit')
    const body = await request.json()
    
    return NextResponse.json({ 
      message: 'Simple nutrition route working',
      received: body 
    })
  } catch (error) {
    console.error('Nutrition route error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Simple nutrition GET working' })
}