import { NextResponse } from 'next/server'
import { getPublicTutors } from '@/lib/tutors'

export async function GET() {
  try {
    const tutors = getPublicTutors()
    return NextResponse.json(tutors)
  } catch (error) {
    console.error('Error fetching tutors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutors' },
      { status: 500 }
    )
  }
}

