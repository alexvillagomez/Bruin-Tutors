'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculateHourlyPriceCents } from '@/lib/pricing'
import BookingTutorHeader from '@/components/BookingTutorHeader'
import type { Tutor } from '@/lib/types'
import styles from './page.module.css'

type SessionLength = 60 | 15 | null // Only 60-minute sessions and 15-minute consultations
type BookingData = {
  sessionLength: SessionLength
  tutorId: string | null
  timeSlot: string | null
  parentName: string
  parentEmail: string
  studentName: string
  studentEmail: string
  studentGrade: string
  course: string
  needsHelpWith: string
  materialsLink: string
  files: File[] // For file uploads
}

function BookNowContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tutorSlug = searchParams.get('tutor')
  
  const [step, setStep] = useState(1)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loadingTutors, setLoadingTutors] = useState(true)
  const [availability, setAvailability] = useState<string[]>([])
  const [slotTitles, setSlotTitles] = useState<Record<string, string>>({}) // Map of slot ISO to event title
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendarNotConnected, setCalendarNotConnected] = useState(false)
  const [dayOffset, setDayOffset] = useState(0) // For pagination through days
  const [userTimezone, setUserTimezone] = useState<string>('America/Los_Angeles') // Default to PST
  const [timezoneAbbr, setTimezoneAbbr] = useState<string>('PST') // Default abbreviation
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionLength: null,
    tutorId: null,
    timeSlot: null,
    parentName: '',
    parentEmail: '',
    studentName: '',
    studentEmail: '',
    studentGrade: '',
    course: '',
    needsHelpWith: '',
    materialsLink: '',
    files: []
  })

  // Reset booking data when navigating from homepage (no query params)
  useEffect(() => {
    // Only reset if there's no tutor slug in URL and we're on step 1
    if (!tutorSlug && step === 1) {
      setBookingData({
        sessionLength: null,
        tutorId: null,
        timeSlot: null,
        parentName: '',
        parentEmail: '',
        studentName: '',
        studentEmail: '',
        studentGrade: '',
        course: '',
        needsHelpWith: '',
        materialsLink: '',
        files: []
      })
    }
  }, [tutorSlug, step])

  // Detect user timezone on mount
  useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      setUserTimezone(detectedTimezone)
      
      // Get timezone abbreviation
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: detectedTimezone,
        timeZoneName: 'short'
      })
      const parts = formatter.formatToParts(now)
      const tzPart = parts.find(part => part.type === 'timeZoneName')
      if (tzPart) {
        setTimezoneAbbr(tzPart.value)
      } else {
        // Fallback: try to get abbreviation from date string
        const tzString = now.toLocaleString('en-US', { timeZone: detectedTimezone, timeZoneName: 'short' })
        const match = tzString.match(/\s([A-Z]{2,5})$/i)
        if (match) {
          setTimezoneAbbr(match[1])
        }
      }
    } catch (err) {
      console.error('Error detecting timezone:', err)
      // Keep defaults (PST)
    }
  }, [])

  // Fetch tutors on mount
  useEffect(() => {
    async function fetchTutors() {
      try {
        const response = await fetch('/api/tutors')
        if (!response.ok) throw new Error('Failed to fetch tutors')
        const data = await response.json()
        setTutors(data)
      } catch (err) {
        setError('Failed to load tutors. Please refresh the page.')
        console.error(err)
      } finally {
        setLoadingTutors(false)
      }
    }
    fetchTutors()
  }, [])

  // Auto-select tutor from query param
  useEffect(() => {
    if (tutorSlug && tutors.length > 0 && !bookingData.tutorId) {
      // Try to find tutor by slug (matching the slug from tutors.ts)
      // First check if it matches an ID from the API tutors
      const tutorFromApi = tutors.find(t => t.id === tutorSlug)
      if (tutorFromApi) {
        setBookingData(prev => ({ ...prev, tutorId: tutorFromApi.id }))
        // If tutor is pre-selected, skip to step 2 (tutor selection) or step 3 (time selection)
        // But only if session length is also selected
        if (bookingData.sessionLength) {
          setStep(3)
        } else {
          setStep(2)
        }
      }
    }
  }, [tutorSlug, tutors, bookingData.tutorId, bookingData.sessionLength])

  // When session length is selected and tutor is already set (from query param), move to step 3
  useEffect(() => {
    if (bookingData.tutorId && bookingData.sessionLength && step === 2) {
      setStep(3)
    }
  }, [bookingData.tutorId, bookingData.sessionLength, step])

  // Fetch availability when tutor and session length are selected
  // This runs whenever step becomes 3 or higher, or when tutor/sessionLength changes while on step 3+
  useEffect(() => {
    if (bookingData.tutorId && bookingData.sessionLength && step >= 3) {
      // Use a small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        fetchAvailability()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setAvailability([])
    }
  }, [bookingData.tutorId, bookingData.sessionLength, step])

  async function fetchAvailability() {
    if (!bookingData.tutorId || !bookingData.sessionLength) return

    setLoadingAvailability(true)
    setError(null)
    try {
      const sessionLength = bookingData.sessionLength === 15 ? 15 : bookingData.sessionLength
      const response = await fetch(
        `/api/availability?tutorId=${bookingData.tutorId}&sessionLength=${sessionLength}`
      )
      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to fetch availability'
        console.error('Availability API error:', errorMessage)
        throw new Error(errorMessage)
      }
      const data = await response.json()
      console.log('Availability data received:', { slotCount: data.slots?.length || 0, calendarNotConnected: data.calendarNotConnected })
      
      // Check if calendar is not connected
      if (data.calendarNotConnected) {
        setCalendarNotConnected(true)
        setAvailability([]) // No time slots available, but allow booking to proceed
        setSlotTitles({})
      } else {
        setCalendarNotConnected(false)
        setAvailability(data.slots || [])
        setSlotTitles(data.slotTitles || {}) // Store event titles for pricing
      }
      
      // Also check tutor's calendar connection status
      const tutor = tutors.find(t => t.id === bookingData.tutorId)
      if (tutor && !tutor.calendarConnected) {
        setCalendarNotConnected(true)
      }
      
      // Reset day offset when availability changes
      setDayOffset(0)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load available times. Please try again.'
      setError(errorMsg)
      console.error('Error fetching availability:', err)
      setAvailability([])
    } finally {
      setLoadingAvailability(false)
    }
  }

  const selectedTutor = tutors.find(t => t.id === bookingData.tutorId)
  const availableTutors = bookingData.sessionLength === 15
    ? tutors.filter(t => t.id === 'alex-villagomez')
    : tutors

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone
    })
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone
    })
  }

  const formatTimeWithTimezone = (isoString: string) => {
    const time = formatTime(isoString)
    return `${time} ${timezoneAbbr}`
  }

  // Group availability slots by day
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    
    availability.forEach(slot => {
      const date = new Date(slot)
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(slot)
    })
    
    // Sort slots within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    })
    
    // Sort days chronologically
    const sortedDays = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a][0])
      const dateB = new Date(grouped[b][0])
      return dateA.getTime() - dateB.getTime()
    })
    
    return sortedDays.map(day => ({
      dayName: day,
      slots: grouped[day]
    }))
  }, [availability])

  // Paginate days (show 4 days at a time)
  const DAYS_PER_PAGE = 4
  const visibleDays = slotsByDay.slice(dayOffset, dayOffset + DAYS_PER_PAGE)
  const hasMoreDays = dayOffset + DAYS_PER_PAGE < slotsByDay.length
  const hasPreviousDays = dayOffset > 0

  // Calculate price for a time slot using the simple pricing algorithm
  const getSlotPrice = (slotISO: string): { price: number; breakdown: string } => {
    if (bookingData.sessionLength === 15) return { price: 0, breakdown: 'Free consultation' }
    if (!bookingData.sessionLength || !selectedTutor) return { price: 0, breakdown: '' }
    
    // Get event title for this slot (for WTP rating)
    // For now, use slotTitles from API, or fallback to tutor's calendarTitleForPricing
    const eventTitle = slotTitles[slotISO] || selectedTutor.calendarTitleForPricing || undefined
    
    // Use the simple pricing algorithm with tutor's base rate
    const result = calculateHourlyPriceCents({
      startISO: slotISO,
      calendarTitle: eventTitle,
      baseRateCents: selectedTutor.baseRateCents,
    })
    
    const price = result.hourlyCents / 100 // Convert cents to dollars
    const { breakdown } = result
    
    // Build breakdown string
    const leadText = breakdown.leadAddOnCents > 0 
      ? `+ Lead time $${(breakdown.leadAddOnCents / 100).toFixed(0)}` 
      : breakdown.leadAddOnCents < 0 
      ? `- Lead time $${Math.abs(breakdown.leadAddOnCents / 100).toFixed(0)}`
      : ''
    const wtpText = breakdown.wtpAddOnCents > 0
      ? `+ WTP $${(breakdown.wtpAddOnCents / 100).toFixed(0)}`
      : breakdown.wtpAddOnCents < 0
      ? `- WTP $${Math.abs(breakdown.wtpAddOnCents / 100).toFixed(0)}`
      : ''
    
    const breakdownStr = `Base $50${leadText ? ` ${leadText}` : ''}${wtpText ? ` ${wtpText}` : ''}`
    
    return { price, breakdown: breakdownStr }
  }

  const getSessionPrice = () => {
    if (bookingData.sessionLength === 15) return 0
    if (!bookingData.sessionLength || !bookingData.timeSlot) return 0
    
    // Use the simple pricing algorithm with tutor's base rate
    const eventTitle = bookingData.timeSlot ? slotTitles[bookingData.timeSlot] : undefined
    const selectedTutor = tutors.find(t => t.id === bookingData.tutorId)
    const calendarTitle = eventTitle || selectedTutor?.calendarTitleForPricing || undefined
    
    const result = calculateHourlyPriceCents({
      startISO: bookingData.timeSlot,
      calendarTitle,
      baseRateCents: selectedTutor?.baseRateCents,
    })
    
    return result.hourlyCents / 100 // Convert cents to dollars
  }

  const canContinueStep1 = bookingData.sessionLength !== null
  const canContinueStep2 = bookingData.tutorId !== null
  // Allow continuing if calendar not connected (no time slot needed) or if time slot is selected
  const canContinueStep3 = calendarNotConnected || bookingData.timeSlot !== null
  const canContinueStep4 = bookingData.parentName.trim() !== '' &&
    bookingData.parentEmail.trim() !== '' &&
    bookingData.studentName.trim() !== '' &&
    bookingData.studentEmail.trim() !== '' &&
    bookingData.studentGrade !== '' &&
    bookingData.course.trim() !== '' &&
    bookingData.needsHelpWith.trim() !== ''

  const handleContinue = () => {
    if (step === 1 && canContinueStep1) {
      if (bookingData.sessionLength === 15) {
        setBookingData({ ...bookingData, tutorId: 'alex-villagomez' })
        setStep(3) // Skip tutor selection for consultation
      } else {
        setStep(2)
      }
    } else if (step === 2 && canContinueStep2) {
      setStep(3)
    } else if (step === 3 && canContinueStep3) {
      setStep(4)
    } else if (step === 4 && canContinueStep4) {
      setStep(5)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      if (step === 3 && bookingData.sessionLength === 15) {
        // For 15-minute consultation, back button goes to step 1 (session selection)
        setStep(1)
        setBookingData({ ...bookingData, tutorId: null, timeSlot: null })
      } else {
        setStep(step - 1)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBookingData({ ...bookingData, files: Array.from(e.target.files) })
    }
  }

  const handlePayment = async () => {
    if (!bookingData.tutorId || !bookingData.sessionLength) {
      setError('Missing booking information')
      return
    }
    
    // Time slot is required unless calendar is not connected
    if (!calendarNotConnected && !bookingData.timeSlot) {
      setError('Please select a time slot')
      return
    }

    // Skip payment for free consultations
    if (bookingData.sessionLength === 15) {
      // Handle free consultation booking directly
      await handleFreeConsultation()
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Validate time slot is selected (required for paid sessions)
      if (!bookingData.timeSlot && !calendarNotConnected) {
        throw new Error('Please select a time slot')
      }

      // Get tutor slug from query param or tutor data
      const tutorSlugParam = tutorSlug || bookingData.tutorId
      
      // Get calendar connection status and event title for selected tutor
      const selectedTutorData = tutors.find(t => t.id === bookingData.tutorId)
      const tutorCalendarConnected = selectedTutorData?.calendarConnected ?? true
      const eventTitle = bookingData.timeSlot ? slotTitles[bookingData.timeSlot] : selectedTutorData?.calendarTitleForPricing || undefined

      // Create Stripe checkout session (booking will be created via webhook after payment)
      // Price calculated server-side, booking created in webhook
      // Pass client's current timestamp to ensure frontend and backend calculate the same price
      const checkoutResponse = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currency: 'usd',
          description: '60-minute tutoring session',
          tutorSlug: tutorSlugParam,
          parentEmail: bookingData.parentEmail,
          parentName: bookingData.parentName,
          studentEmail: bookingData.studentEmail,
          studentName: bookingData.studentName,
          sessionLength: 60, // Always 60 minutes
          calendarConnected: tutorCalendarConnected,
          startDateTimeISO: bookingData.timeSlot, // Pass to server for price calculation
          calendarEventTitle: eventTitle, // Pass event title for server-side price calculation
          clientNowISO: new Date().toISOString(), // Pass client's current time to match frontend calculation
        })
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        throw new Error(errorData.error || 'Failed to create payment session')
      }

      const { url, calculatedPrice } = await checkoutResponse.json()
      
      // Log the calculated price for debugging
      if (calculatedPrice !== undefined) {
        console.log('Server-calculated price:', calculatedPrice)
        // Note: We could update the displayed price here, but since we're redirecting
        // to Stripe, the price shown in Stripe will be correct
      }
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process payment. Please try again.')
      console.error(err)
      setSubmitting(false)
    }
  }

  const handleFreeConsultation = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // For free consultations, if no time slot selected and calendar not connected, use a placeholder
      const timeSlot = bookingData.timeSlot || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      
      // Include file names in the request (files themselves can't be uploaded without additional setup)
      const fileNames = bookingData.files.map(f => f.name).join(', ')
      
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorId: bookingData.tutorId,
          sessionLength: 15,
          startTimeISO: timeSlot,
          parentName: bookingData.parentName,
          parentEmail: bookingData.parentEmail,
          studentName: bookingData.studentName,
          studentEmail: bookingData.studentEmail,
          grade: bookingData.studentGrade,
          course: bookingData.course,
          helpText: bookingData.needsHelpWith,
          materialsLink: bookingData.materialsLink || undefined,
          fileNames: fileNames || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const data = await response.json()
      
      // Redirect to success page
      window.location.href = `/payment/success?session_id=free_${data.bookingId}`
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.')
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.bookingSection}>
        <div className={styles.bookingContent}>
          <h1 className={styles.headline}>Book a Session</h1>
          <p className={styles.intro}>
            Choose your session type, select a tutor, pick a time, and we'll take care of the rest.
          </p>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Progress indicator */}
          <div className={styles.progressBar}>
            <div className={styles.progressStep} data-active={step >= 1}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Session</span>
            </div>
            <div className={styles.progressStep} data-active={step >= 2} data-skip={bookingData.sessionLength === 15}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Tutor</span>
            </div>
            <div className={styles.progressStep} data-active={step >= 3}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>Time</span>
            </div>
            <div className={styles.progressStep} data-active={step >= 4}>
              <span className={styles.stepNumber}>4</span>
              <span className={styles.stepLabel}>Details</span>
            </div>
            <div className={styles.progressStep} data-active={step >= 5}>
              <span className={styles.stepNumber}>5</span>
              <span className={styles.stepLabel}>Review</span>
            </div>
          </div>

          {/* Step 1: Session Length */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Choose Session Length</h2>
              <div className={styles.sessionOptions}>
                <button
                  className={`${styles.sessionOption} ${bookingData.sessionLength === 60 ? styles.selected : ''}`}
                  onClick={() => setBookingData({ ...bookingData, sessionLength: 60, tutorId: null, timeSlot: null })}
                >
                  <div className={styles.sessionOptionHeader}>
                    <span className={styles.sessionLength}>60 Minutes</span>
                  </div>
                  <p className={styles.sessionDescription}>Standard tutoring session</p>
                </button>
                <button
                  className={`${styles.sessionOption} ${bookingData.sessionLength === 15 ? styles.selected : ''}`}
                  onClick={() => setBookingData({ ...bookingData, sessionLength: 15, tutorId: null, timeSlot: null })}
                >
                  <div className={styles.sessionOptionHeader}>
                    <span className={styles.sessionLength}>1-on-1 Consultation</span>
                  </div>
                  <p className={styles.sessionDescription}>Free consultation with Alex</p>
                </button>
              </div>
              <p className={styles.inPersonNote}>
                Looking for in-person tutoring in Los Angeles? <a href="/contact" className={styles.link}>Contact us</a>.
              </p>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.button} ${styles.primary} ${!canContinueStep1 ? styles.disabled : ''}`}
                  onClick={handleContinue}
                  disabled={!canContinueStep1}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Tutor Selection */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Choose Your Tutor</h2>
              {loadingTutors ? (
                <div className={styles.emptyState}>
                  <p>Loading tutors...</p>
                </div>
              ) : availableTutors.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No tutors available. Please contact us.</p>
                </div>
              ) : (
                <>
                  <div className={styles.tutorGrid}>
                    {availableTutors.map(tutor => {
                      return (
                        <div
                          key={tutor.id}
                          className={`${styles.tutorCard} ${bookingData.tutorId === tutor.id ? styles.selected : ''}`}
                        >
                          <button
                            className={styles.tutorCardButton}
                            onClick={() => setBookingData({ ...bookingData, tutorId: tutor.id, timeSlot: null })}
                          >
                            <h3 className={styles.tutorName}>{tutor.displayName}</h3>
                            <div className={styles.tutorSubjects}>
                              <strong>Subjects:</strong>
                              <ul>
                                {tutor.subjects.map(subject => (
                                  <li key={subject}>{subject}</li>
                                ))}
                              </ul>
                            </div>
                          </button>
                          <Link 
                            href={`/tutors?tutor=${tutor.id}`}
                            className={styles.viewProfileLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Tutor
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                  <div className={styles.buttonGroup}>
                    <button className={styles.button} onClick={handleBack}>
                      Back
                    </button>
                    <button
                      className={`${styles.button} ${styles.primary} ${!canContinueStep2 ? styles.disabled : ''}`}
                      onClick={handleContinue}
                      disabled={!canContinueStep2}
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Time Selection */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Choose a Time</h2>
              <p className={styles.timezoneNote}>
                Times shown in your timezone: <strong>{timezoneAbbr}</strong> ({userTimezone})
              </p>
              {selectedTutor ? (
                <>
                  <BookingTutorHeader
                    tutorId={selectedTutor.id}
                    name={selectedTutor.displayName}
                    imageSrc={selectedTutor.photoUrl || undefined}
                    subjects={selectedTutor.subjects}
                  />
                  {loadingAvailability ? (
                    <div className={styles.emptyState}>
                      <p>Loading available times...</p>
                    </div>
                  ) : calendarNotConnected ? (
                    <div className={styles.emptyState}>
                      <p>
                        {selectedTutor.displayName}'s calendar is being finalized. 
                        Your request will be confirmed after payment.
                      </p>
                    </div>
                  ) : availability.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No available times for this tutor. Please check back later or contact us.</p>
                    </div>
                  ) : (
                    <>
                      {/* Day Navigation */}
                      {(hasPreviousDays || hasMoreDays) && (
                        <div className={styles.dayNavigation}>
                          <button
                            className={styles.dayNavButton}
                            onClick={() => setDayOffset(prev => Math.max(0, prev - DAYS_PER_PAGE))}
                            disabled={!hasPreviousDays}
                          >
                            ← Previous Days
                          </button>
                          <span className={styles.dayNavInfo}>
                            Showing {dayOffset + 1}-{Math.min(dayOffset + DAYS_PER_PAGE, slotsByDay.length)} of {slotsByDay.length} days
                          </span>
                          <button
                            className={styles.dayNavButton}
                            onClick={() => setDayOffset(prev => prev + DAYS_PER_PAGE)}
                            disabled={!hasMoreDays}
                          >
                            Next Days →
                          </button>
                        </div>
                      )}

                      {/* Day Columns */}
                      <div className={styles.dayColumns}>
                        {visibleDays.map(({ dayName, slots }) => (
                          <div key={dayName} className={styles.dayColumn}>
                            <h3 className={styles.dayColumnHeader}>{dayName}</h3>
                            <div className={styles.dayTimeSlots}>
                              {slots.map(slot => {
                                const priceData = getSlotPrice(slot)
                                const isSelected = bookingData.timeSlot === slot
                                return (
                                  <button
                                    key={slot}
                                    className={`${styles.timeSlot} ${isSelected ? styles.selected : ''}`}
                                    onClick={() => setBookingData({ ...bookingData, timeSlot: slot })}
                                  >
                                    <span className={styles.timeTime}>{formatTimeWithTimezone(slot)}</span>
                                    {priceData.price > 0 && (
                                      <span className={styles.timePrice}>${priceData.price.toFixed(2)}</span>
                                    )}
                                    {priceData.price === 0 && bookingData.sessionLength === 15 && (
                                      <span className={styles.timePrice}>Free</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {visibleDays.length === 0 && (
                        <div className={styles.emptyState}>
                          <p>No available times in this date range.</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p>Please select a tutor first.</p>
                </div>
              )}
              <div className={styles.buttonGroup}>
                <button className={styles.button} onClick={handleBack}>
                  Back
                </button>
                <button
                  className={`${styles.button} ${styles.primary} ${!canContinueStep3 ? styles.disabled : ''}`}
                  onClick={handleContinue}
                  disabled={!canContinueStep3}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Details Form */}
          {step === 4 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Contact Information</h2>
              <form className={styles.bookingForm} onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
                <div className={styles.formGroup}>
                  <label htmlFor="parentName" className={styles.label}>
                    Parent Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    className={styles.input}
                    value={bookingData.parentName}
                    onChange={(e) => setBookingData({ ...bookingData, parentName: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="parentEmail" className={styles.label}>
                    Parent Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="parentEmail"
                    className={styles.input}
                    value={bookingData.parentEmail}
                    onChange={(e) => setBookingData({ ...bookingData, parentEmail: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="studentName" className={styles.label}>
                    Student Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    className={styles.input}
                    value={bookingData.studentName}
                    onChange={(e) => setBookingData({ ...bookingData, studentName: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="studentEmail" className={styles.label}>
                    Student Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="studentEmail"
                    className={styles.input}
                    value={bookingData.studentEmail}
                    onChange={(e) => setBookingData({ ...bookingData, studentEmail: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="studentGrade" className={styles.label}>
                    Student Grade <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="studentGrade"
                    className={styles.select}
                    value={bookingData.studentGrade}
                    onChange={(e) => setBookingData({ ...bookingData, studentGrade: e.target.value })}
                    required
                  >
                    <option value="">Select grade</option>
                    <option value="9">9th Grade</option>
                    <option value="10">10th Grade</option>
                    <option value="11">11th Grade</option>
                    <option value="12">12th Grade</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="course" className={styles.label}>
                    Course <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="course"
                    className={styles.input}
                    placeholder="e.g., AP Calculus BC"
                    value={bookingData.course}
                    onChange={(e) => setBookingData({ ...bookingData, course: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="needsHelpWith" className={styles.label}>
                    What does the student need help with? <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="needsHelpWith"
                    className={styles.textarea}
                    rows={4}
                    placeholder="Describe specific topics, assignments, or areas where help is needed..."
                    value={bookingData.needsHelpWith}
                    onChange={(e) => setBookingData({ ...bookingData, needsHelpWith: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="materialsLink" className={styles.label}>
                    Materials Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="materialsLink"
                    className={styles.input}
                    placeholder="https://..."
                    value={bookingData.materialsLink}
                    onChange={(e) => setBookingData({ ...bookingData, materialsLink: e.target.value })}
                  />
                  <p className={styles.helperText}>
                    Share a link to notes, homework, or practice problems
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="files" className={styles.label}>
                    Upload Files (Optional)
                  </label>
                  <input
                    type="file"
                    id="files"
                    className={styles.input}
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  <p className={styles.helperText}>
                    Upload homework, notes, or practice problems. Files will be included in the calendar event.
                  </p>
                  {bookingData.files.length > 0 && (
                    <div className={styles.fileList}>
                      {bookingData.files.map((file, index) => (
                        <span key={index} className={styles.fileItem}>
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.buttonGroup}>
                  <button type="button" className={styles.button} onClick={handleBack}>
                    Back
                  </button>
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.primary} ${!canContinueStep4 ? styles.disabled : ''}`}
                    disabled={!canContinueStep4}
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 5: Review & Payment */}
          {step === 5 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Review & Confirm</h2>
              <div className={styles.reviewSection}>
                <div className={styles.reviewItem}>
                  <strong>Session:</strong>
                  <span>
                    {bookingData.sessionLength === 15
                      ? 'Free 15-minute Consultation'
                      : '60-minute session'}
                  </span>
                </div>
                {bookingData.sessionLength === 60 && bookingData.timeSlot && (
                  <div className={styles.reviewItem}>
                    <strong>Price:</strong>
                    <span>
                      ${getSessionPrice().toFixed(2)} (60 minutes)
                    </span>
                  </div>
                )}
                <div className={styles.reviewItem}>
                  <strong>Tutor:</strong>
                  <span>{selectedTutor?.displayName}</span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Time:</strong>
                  <span>
                    {bookingData.timeSlot && (
                      <>
                        {formatDate(bookingData.timeSlot)} at {formatTimeWithTimezone(bookingData.timeSlot)}
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Parent Name:</strong>
                  <span>{bookingData.parentName}</span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Parent Email:</strong>
                  <span>{bookingData.parentEmail}</span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Student Name:</strong>
                  <span>{bookingData.studentName}</span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Student Email:</strong>
                  <span>{bookingData.studentEmail}</span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Student Grade:</strong>
                  <span>{bookingData.studentGrade}</span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Course:</strong>
                  <span>{bookingData.course}</span>
                </div>
                <div className={styles.reviewItem}>
                  <strong>Needs Help With:</strong>
                  <span>{bookingData.needsHelpWith}</span>
                </div>
                {bookingData.materialsLink && (
                  <div className={styles.reviewItem}>
                    <strong>Materials Link:</strong>
                    <a href={bookingData.materialsLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      {bookingData.materialsLink}
                    </a>
                  </div>
                )}
                {bookingData.files.length > 0 && (
                  <div className={styles.reviewItem}>
                    <strong>Uploaded Files:</strong>
                    <div className={styles.fileList}>
                      {bookingData.files.map((file, index) => (
                        <span key={index} className={styles.fileItem}>
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.paymentSection}>
                <div className={styles.priceSummary}>
                  <div className={styles.priceRow}>
                    <span>Session Fee (60 minutes)</span>
                    <span>${getSessionPrice().toFixed(2)}</span>
                  </div>
                  <div className={styles.priceTotal}>
                    <span>Total</span>
                    <span>${getSessionPrice().toFixed(2)}</span>
                  </div>
                </div>

                <p className={styles.policyNote}>
                  48+ hours notice = full refund. Within 48 hours, cancellations or reschedules have a $10 fee.
                  Late arrivals do not extend session length unless due to our error.
                </p>

                <p className={styles.zoomNote}>
                  All sessions are conducted over Zoom. You'll receive a meeting link via email.
                </p>

                <div className={styles.buttonGroup}>
                  <button className={styles.button} onClick={handleBack} disabled={submitting}>
                    Back
                  </button>
                  <button
                    className={`${styles.button} ${styles.primary} ${styles.paymentButton}`}
                    onClick={handlePayment}
                    disabled={submitting}
                  >
                    {submitting 
                      ? 'Processing...' 
                      : bookingData.sessionLength === 15
                        ? 'Confirm Consultation'
                        : `Continue to Payment $${getSessionPrice()}`
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default function BookNow() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookNowContent />
    </Suspense>
  )
}
