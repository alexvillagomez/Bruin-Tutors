/**
 * Simple Pricing Algorithm for Tutoring Sessions
 * 
 * Rules:
 * - Base rate: $50/hour (60-minute sessions only)
 * - Lead-time add-on:
 *   - Same day (0 days): +$15
 *   - 1 day in advance: +$10
 *   - 2 days in advance: +$5
 *   - 3+ days in advance: +$0
 * - WTP (Willingness-to-Tutor) rating from calendar event title (1-10):
 *   - Rating 5: +$0 (neutral)
 *   - Rating < 5: +$5 per point below 5
 *   - Rating > 5: -$5 per point above 5
 */

export interface PricingParams {
  startISO: string // Booking start time (ISO string)
  calendarTitle?: string // Calendar event title for WTP rating
  baseRateCents?: number // Base hourly rate in cents (defaults to 5000 = $50 if not specified)
  nowISO?: string // Optional override for testing
}

export interface PricingBreakdown {
  hourlyCents: number // Final hourly price in cents
  baseCents: number // Base rate ($50)
  daysInAdvance: number // 0, 1, 2, or 3 (3 means 3+)
  leadAddOnCents: number // Lead-time add-on in cents
  wtp: number // WTP rating used (1-10)
  wtpAddOnCents: number // WTP adjustment in cents
}

/**
 * Parse WTP (Willingness-to-Tutor) rating 1-10 from calendar event title
 * Returns 5 (neutral) if no valid rating found
 */
export function parseWtpFromTitle(title?: string): number {
  if (!title) return 5

  // Try to find standalone numbers 1-10 first (most reliable)
  const standaloneMatch = title.match(/\b([1-9]|10)\b/)
  if (standaloneMatch) {
    const num = parseInt(standaloneMatch[1], 10)
    if (num >= 1 && num <= 10) {
      return num
    }
  }

  // Try patterns like "7/10", "rating 3", "willingness 5", "(7)"
  const patterns = [
    /(?:rating|willingness|wtp|willing)\s*[:\-]?\s*([1-9]|10)/i,
    /([1-9]|10)\s*\/\s*10/i,
    /\(([1-9]|10)\)/, // e.g., "Lauren Chen (7)"
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 10) {
        return num
      }
    }
  }

  // Default to neutral rating
  return 5
}

/**
 * Compute days in advance (0, 1, 2, or 3 where 3 means 3+)
 * Compares LOCAL calendar dates (not hours)
 */
export function computeDaysInAdvance(startISO: string, now: Date = new Date()): number {
  const startDate = new Date(startISO)
  
  // Get local date strings (YYYY-MM-DD) for comparison
  const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  
  // Calculate difference in days
  const diffTime = startLocal.getTime() - nowLocal.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 0 // Past dates treated as same day
  if (diffDays === 0) return 0 // Same day
  if (diffDays === 1) return 1 // 1 day in advance
  if (diffDays === 2) return 2 // 2 days in advance
  return 3 // 3+ days in advance
}

/**
 * Calculate hourly price in cents with breakdown
 */
export function calculateHourlyPriceCents(params: PricingParams): {
  hourlyCents: number
  breakdown: PricingBreakdown
} {
  // Base rate (default to $50 if not specified)
  const baseCents = params.baseRateCents ?? 5000
  
  // Compute days in advance
  const now = params.nowISO ? new Date(params.nowISO as string) : new Date()
  const daysInAdvance = computeDaysInAdvance(params.startISO, now)
  
  // Calculate lead-time add-on
  let leadAddOnCents = 0
  if (daysInAdvance === 0) {
    leadAddOnCents = 1500 // +$15 for same day
  } else if (daysInAdvance === 1) {
    leadAddOnCents = 1000 // +$10 for 1 day
  } else if (daysInAdvance === 2) {
    leadAddOnCents = 500 // +$5 for 2 days
  }
  // daysInAdvance === 3 means 3+ days, no add-on
  
  // Parse WTP rating from calendar title
  const wtp = parseWtpFromTitle(params.calendarTitle)
  
  // Calculate WTP add-on
  let wtpAddOnCents = 0
  if (wtp < 5) {
    // Add $5 per point below 5
    const pointsBelow = 5 - wtp
    wtpAddOnCents = pointsBelow * 500 // $5 = 500 cents
  } else if (wtp > 5) {
    // Subtract $5 per point above 5
    const pointsAbove = wtp - 5
    wtpAddOnCents = -(pointsAbove * 500) // Negative (discount)
  }
  // wtp === 5 means no adjustment
  
  // Calculate final hourly price
  let hourlyCents = baseCents + leadAddOnCents + wtpAddOnCents
  
  // Clamp at minimum $0
  if (hourlyCents < 0) {
    hourlyCents = 0
  }
  
  return {
    hourlyCents: Math.round(hourlyCents),
    breakdown: {
      hourlyCents: Math.round(hourlyCents),
      baseCents,
      daysInAdvance,
      leadAddOnCents,
      wtp,
      wtpAddOnCents,
    },
  }
}

/**
 * Legacy function for backward compatibility
 * Returns price in dollars for 60-minute session
 */
export type PricingInput = {
  sessionLength: number
  tutorId?: string | null
  tutorSlug?: string
  subject?: string
  timeSlot?: string
  studentGrade?: string
  calendarEventTitle?: string
}

export function calculatePrice(input: PricingInput): number {
  // Only support 60-minute sessions
  if (input.sessionLength !== 60) {
    return 0
  }
  
  if (!input.timeSlot) {
    return 50 // Default $50 if no time slot
  }
  
  const result = calculateHourlyPriceCents({
    startISO: input.timeSlot,
    calendarTitle: input.calendarEventTitle,
  })
  
  return result.hourlyCents / 100 // Convert cents to dollars
}
