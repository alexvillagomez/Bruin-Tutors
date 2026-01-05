import { SessionLength } from './types'

const TIMEZONE = process.env.APP_TIMEZONE || 'America/Los_Angeles'

export interface AvailabilityWindow {
  start: Date
  end: Date
}

export interface BookingBlock {
  start: Date
  end: Date
}

export interface SlotWithMetadata {
  isoString: string
  eventTitle?: string // Calendar event title for pricing
}

/**
 * Generate time slots in 30-minute increments that fit within availability windows
 */
export function generateSlots(
  windows: AvailabilityWindow[],
  sessionLength: SessionLength,
  bookings: BookingBlock[] = [],
  windowTitles?: Map<AvailabilityWindow, string> // Optional: map windows to their event titles
): string[] {
  const slots: string[] = []
  const slotDurationMinutes = sessionLength

  for (const window of windows) {
    // Round start time up to nearest hour or half-hour
    let currentTime = new Date(window.start)
    const minutes = currentTime.getMinutes()
    
    // Round up to next hour or half-hour mark
    if (minutes === 0 || minutes === 30) {
      // Already on the hour or half-hour, keep as is
      currentTime.setSeconds(0, 0)
    } else if (minutes < 30) {
      // Round up to the half-hour (e.g., 9:15 -> 9:30)
      currentTime.setMinutes(30, 0, 0)
    } else {
      // Round up to the next hour (e.g., 9:45 -> 10:00)
      currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0)
    }

    while (currentTime.getTime() + slotDurationMinutes * 60 * 1000 <= window.end.getTime()) {
      // Only generate slots that are within the original window
      if (currentTime < window.start) {
        // Move to next 30-minute slot
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
        continue
      }

      const slotStart = new Date(currentTime)
      const slotEnd = new Date(currentTime.getTime() + slotDurationMinutes * 60 * 1000)

      // Check if this slot overlaps with any booking
      const overlaps = bookings.some(booking => {
        return (
          (slotStart >= booking.start && slotStart < booking.end) ||
          (slotEnd > booking.start && slotEnd <= booking.end) ||
          (slotStart <= booking.start && slotEnd >= booking.end)
        )
      })

      if (!overlaps) {
        slots.push(slotStart.toISOString())
      }

      // Move to next 30-minute slot
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
    }
  }

  return slots.sort()
}

/**
 * Helper to find event title for a window by matching start/end times
 */
function findWindowTitle(
  window: AvailabilityWindow,
  windowTitles: Array<{ window: AvailabilityWindow; title: string }>
): string | undefined {
  const match = windowTitles.find(
    ({ window: w }) => 
      w.start.getTime() === window.start.getTime() && 
      w.end.getTime() === window.end.getTime()
  )
  return match?.title
}

/**
 * Generate slots with metadata (including event titles for pricing)
 */
export function generateSlotsWithMetadata(
  windows: AvailabilityWindow[],
  sessionLength: SessionLength,
  bookings: BookingBlock[] = [],
  windowTitles?: Array<{ window: AvailabilityWindow; title: string }> | Map<AvailabilityWindow, string>
): SlotWithMetadata[] {
  const slots: SlotWithMetadata[] = []
  const slotDurationMinutes = sessionLength

  // Convert Map to array format if needed
  const titlesArray: Array<{ window: AvailabilityWindow; title: string }> = 
    windowTitles instanceof Map
      ? Array.from(windowTitles.entries()).map(([window, title]) => ({ window, title }))
      : windowTitles || []

  for (const window of windows) {
    const eventTitle = findWindowTitle(window, titlesArray)
    
    // Round start time up to nearest hour or half-hour
    let currentTime = new Date(window.start)
    const minutes = currentTime.getMinutes()
    
    // Round up to next hour or half-hour mark
    if (minutes === 0 || minutes === 30) {
      currentTime.setSeconds(0, 0)
    } else if (minutes < 30) {
      currentTime.setMinutes(30, 0, 0)
    } else {
      currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0)
    }

    while (currentTime.getTime() + slotDurationMinutes * 60 * 1000 <= window.end.getTime()) {
      if (currentTime < window.start) {
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
        continue
      }

      const slotStart = new Date(currentTime)
      const slotEnd = new Date(currentTime.getTime() + slotDurationMinutes * 60 * 1000)

      const overlaps = bookings.some(booking => {
        return (
          (slotStart >= booking.start && slotStart < booking.end) ||
          (slotEnd > booking.start && slotEnd <= booking.end) ||
          (slotStart <= booking.start && slotEnd >= booking.end)
        )
      })

      if (!overlaps) {
        slots.push({
          isoString: slotStart.toISOString(),
          eventTitle,
        })
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
    }
  }

  return slots.sort((a, b) => a.isoString.localeCompare(b.isoString))
}

/**
 * Parse Google Calendar event to AvailabilityWindow
 */
export function parseAvailabilityEvent(event: any): AvailabilityWindow | null {
  if (!event.start || !event.end) return null

  const start = event.start.dateTime 
    ? new Date(event.start.dateTime)
    : new Date(event.start.date)
  
  const end = event.end.dateTime
    ? new Date(event.end.dateTime)
    : new Date(event.end.date)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

  return { start, end }
}

/**
 * Parse Google Calendar event to AvailabilityWindow with title
 */
export function parseAvailabilityEventWithTitle(event: any): { window: AvailabilityWindow; title: string } | null {
  const window = parseAvailabilityEvent(event)
  if (!window) return null

  return {
    window,
    title: event.summary || '',
  }
}

/**
 * Parse Google Calendar event to BookingBlock
 */
export function parseBookingEvent(event: any): BookingBlock | null {
  if (!event.start || !event.end) return null

  const start = event.start.dateTime 
    ? new Date(event.start.dateTime)
    : new Date(event.start.date)
  
  const end = event.end.dateTime
    ? new Date(event.end.dateTime)
    : new Date(event.end.date)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

  return { start, end }
}

