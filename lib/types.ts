export type Tutor = {
  id: string
  displayName: string
  subjects: string[]
  blurb: string // Long description for Tutors page
  bookingBlurb?: string // Short description for booking page
  photoUrl?: string | null // Optional photo URL
  baseRateCents?: number // Base hourly rate in cents (defaults to 5000 = $50 if not specified)
  calendarTitleForPricing?: string // Placeholder calendar title for WTP rating until real calendar integration
  availabilityCalendarId?: string // Optional - not all tutors have calendar connected
  bookingsCalendarId?: string // Optional - not all tutors have calendar connected
  calendarConnected: boolean // Indicates if Google Calendar is set up
  zoomLink?: string // Optional Zoom meeting link for the tutor
  isActive: boolean
  sortOrder: number
}

export type TutorPublic = {
  id: string
  displayName: string
  subjects: string[]
  blurb: string
  bookingBlurb?: string
  photoUrl?: string | null
  baseRateCents?: number // Base hourly rate in cents
  calendarConnected: boolean
}

export type SessionLength = 60 | 15 // Only 60-minute sessions and 15-minute consultations

export type BookingRequest = {
  tutorId: string
  sessionLength: SessionLength // Only 60 or 15
  startTimeISO: string
  parentName: string
  parentEmail: string
  studentName: string
  studentEmail: string
  grade: string
  course: string
  helpText: string
  materialsLink?: string
  fileNames?: string // Optional comma-separated list of uploaded file names
}

