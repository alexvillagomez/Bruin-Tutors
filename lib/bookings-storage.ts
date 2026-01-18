import { promises as fs } from 'fs'
import path from 'path'

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json')

export interface BookingRecord {
  id: string
  bookingId?: string
  stripeSessionId?: string
  tutorId: string
  tutorName: string
  sessionLength: number
  startTime: string
  endTime: string
  parentName: string
  parentEmail: string
  studentName: string
  studentEmail: string
  studentGrade?: string
  course?: string
  needsHelpWith?: string
  price?: number
  priceCents?: number
  status: 'completed' | 'pending' | 'cancelled'
  createdAt: string
  calendarEventId?: string
  calendarEventLink?: string
}

export async function saveBooking(booking: BookingRecord): Promise<void> {
  let bookings: BookingRecord[] = []
  
  try {
    const data = await fs.readFile(BOOKINGS_FILE, 'utf-8')
    bookings = JSON.parse(data)
  } catch (error) {
    // File doesn't exist yet, start with empty array
  }
  
  bookings.push(booking)
  
  // Ensure data directory exists
  await fs.mkdir(path.dirname(BOOKINGS_FILE), { recursive: true })
  
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8')
}

export async function getBookings(): Promise<BookingRecord[]> {
  try {
    const data = await fs.readFile(BOOKINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

export async function getBookingsByTutor(tutorId: string): Promise<BookingRecord[]> {
  const bookings = await getBookings()
  return bookings.filter(b => b.tutorId === tutorId)
}

export async function getBookingById(id: string): Promise<BookingRecord | null> {
  const bookings = await getBookings()
  return bookings.find(b => b.id === id || b.bookingId === id || b.stripeSessionId === id) || null
}

