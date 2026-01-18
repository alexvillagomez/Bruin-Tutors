import { NextResponse } from 'next/server'
import { getBookings, getBookingsByTutor } from '@/lib/bookings-storage'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tutorId = searchParams.get('tutorId')
    
    // Optional: Add authentication here to protect this endpoint
    // For now, we'll keep it simple - you can add auth later
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    if (tutorId) {
      const bookings = await getBookingsByTutor(tutorId)
      return NextResponse.json({ bookings })
    }
    
    const bookings = await getBookings()
    // Sort by date (newest first)
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({ bookings })
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

