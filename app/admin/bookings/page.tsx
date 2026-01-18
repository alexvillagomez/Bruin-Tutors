'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import styles from './page.module.css'

interface Booking {
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

function BookingsContent() {
  const searchParams = useSearchParams()
  const tutorFilter = searchParams.get('tutor')
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const url = tutorFilter 
          ? `/api/admin/bookings?tutorId=${tutorFilter}`
          : '/api/admin/bookings'
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch bookings')
        }
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load bookings')
        console.error('Error fetching bookings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [tutorFilter])

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return <div className={styles.container}><p>Loading bookings...</p></div>
  }

  if (error) {
    return <div className={styles.container}><p className={styles.error}>Error: {error}</p></div>
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>All Bookings</h1>
        
        {tutorFilter && (
          <p className={styles.filterNote}>Filtered by tutor ID: {tutorFilter}</p>
        )}
        
        {bookings.length === 0 ? (
          <p className={styles.empty}>No bookings found.</p>
        ) : (
          <>
            <p className={styles.count}>Total bookings: {bookings.length}</p>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tutor</th>
                    <th>Student</th>
                    <th>Parent</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Calendar</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{formatDate(booking.startTime)}</td>
                      <td>{booking.tutorName}</td>
                      <td>
                        <div>{booking.studentName}</div>
                        <div className={styles.email}>{booking.studentEmail}</div>
                      </td>
                      <td>
                        <div>{booking.parentName}</div>
                        <div className={styles.email}>{booking.parentEmail}</div>
                      </td>
                      <td>
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </td>
                      <td>{booking.sessionLength} min</td>
                      <td>
                        {booking.price !== undefined 
                          ? `$${booking.price.toFixed(2)}` 
                          : booking.priceCents !== undefined
                          ? `$${(booking.priceCents / 100).toFixed(2)}`
                          : 'Free'}
                      </td>
                      <td>{booking.course || '-'}</td>
                      <td>
                        <span className={`${styles.status} ${styles[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        {booking.calendarEventLink ? (
                          <a 
                            href={booking.calendarEventLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.link}
                          >
                            View
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingsContent />
    </Suspense>
  )
}

