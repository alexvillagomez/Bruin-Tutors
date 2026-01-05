/**
 * Calendar utility functions for generating time slots and date ranges
 */

export interface TimeSlot {
  hour: number
  minute: number
  display: string
}

export interface CalendarDay {
  date: Date
  dayName: string
  dayNumber: number
  month: string
  isToday: boolean
  isPast: boolean
}

/**
 * Generate time slots in 30-minute increments
 */
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 20,
  incrementMinutes: number = 30
): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += incrementMinutes) {
      const time = new Date()
      time.setHours(hour, minute, 0, 0)
      
      slots.push({
        hour,
        minute,
        display: time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      })
    }
  }
  
  return slots
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get a week of dates starting from a given date
 */
export function getWeekDates(startDate: Date): CalendarDay[] {
  const week: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i)
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    
    week.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: dateOnly.getTime() === today.getTime(),
      isPast: dateOnly < today
    })
  }
  
  return week
}

/**
 * Format date range for display (e.g., "Jan 8 – Jan 14")
 */
export function formatWeekRange(startDate: Date): string {
  const endDate = addDays(startDate, 6)
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${start} – ${end}`
}

/**
 * Check if a datetime slot is available
 * TODO: Replace with real availability data from API
 */
export function isSlotAvailable(
  date: Date,
  availableSlots: string[] = []
): boolean {
  // If we have real availability data, check against it
  if (availableSlots.length > 0) {
    const slotISO = date.toISOString()
    // Check if this slot matches any available slot (within 30 min window)
    return availableSlots.some(available => {
      const availableDate = new Date(available)
      const diff = Math.abs(date.getTime() - availableDate.getTime())
      return diff < 30 * 60 * 1000 // Within 30 minutes
    })
  }
  
  // Placeholder: Available on weekdays 10 AM - 6 PM
  const day = date.getDay()
  const hour = date.getHours()
  const isWeekday = day >= 1 && day <= 5 // Monday to Friday
  const isBusinessHours = hour >= 10 && hour < 18
  
  return isWeekday && isBusinessHours
}

/**
 * Create a datetime from a date and time slot
 */
export function createDateTime(date: Date, slot: TimeSlot): Date {
  const result = new Date(date)
  result.setHours(slot.hour, slot.minute, 0, 0)
  return result
}

