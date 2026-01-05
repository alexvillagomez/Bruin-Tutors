import { parseWillingnessRating, calculateTotalPrice } from '../pricing'

describe('parseWillingnessRating', () => {
  test('returns 5 (neutral) when no title provided', () => {
    expect(parseWillingnessRating()).toBe(5)
    expect(parseWillingnessRating('')).toBe(5)
  })

  test('parses standalone numbers 1-10', () => {
    expect(parseWillingnessRating('Available 7')).toBe(7)
    expect(parseWillingnessRating('Session 3')).toBe(3)
    expect(parseWillingnessRating('10')).toBe(10)
    expect(parseWillingnessRating('1')).toBe(1)
  })

  test('parses rating from patterns like "Lauren Chen (7)"', () => {
    expect(parseWillingnessRating('Lauren Chen (7)')).toBe(7)
    expect(parseWillingnessRating('Available (3)')).toBe(3)
  })

  test('parses rating from "7/10" pattern', () => {
    expect(parseWillingnessRating('Willingness 7/10')).toBe(7)
    expect(parseWillingnessRating('Rating: 3/10')).toBe(3)
  })

  test('parses rating from "rating 5" or "willingness 8" patterns', () => {
    expect(parseWillingnessRating('rating 5')).toBe(5)
    expect(parseWillingnessRating('Willingness: 8')).toBe(8)
    expect(parseWillingnessRating('willing 2')).toBe(2)
  })

  test('prefers standalone numbers over patterns', () => {
    expect(parseWillingnessRating('7 rating 5')).toBe(7) // Standalone 7 comes first
  })

  test('clamps values outside 1-10 range', () => {
    // This shouldn't happen with our regex, but test edge cases
    expect(parseWillingnessRating('0')).toBe(5) // 0 not matched, defaults to 5
    expect(parseWillingnessRating('11')).toBe(5) // 11 not matched, defaults to 5
  })
})

describe('calculateTotalPrice', () => {
  const baseParams = {
    startDateTimeISO: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    durationMinutes: 60,
  }

  test('calculates base price with no multipliers', () => {
    const result = calculateTotalPrice({
      ...baseParams,
      calendarEventTitle: 'Available', // Rating 5 (neutral)
    })

    expect(result.totalCents).toBe(5000) // $50
    expect(result.hourlyCents).toBe(5000)
    expect(result.ratingUsed).toBe(5)
    expect(result.leadTimeMultiplier).toBe(1.0) // > 72 hours
    expect(result.ratingMultiplier).toBe(1.0) // Rating 5 = neutral
    expect(result.finalMultiplier).toBe(1.0)
  })

  test('applies lead time surcharge for bookings < 72 hours', () => {
    const now = new Date()
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 48 hours

    const result = calculateTotalPrice({
      ...baseParams,
      startDateTimeISO: twoDaysFromNow.toISOString(),
      nowISO: now.toISOString(),
      calendarEventTitle: 'Available', // Rating 5
    })

    expect(result.leadTimeMultiplier).toBe(1.1) // +10%
    expect(result.finalMultiplier).toBe(1.1)
    expect(result.totalCents).toBe(5500) // $50 * 1.1 = $55
  })

  test('applies rating multiplier for rating < 5', () => {
    const result = calculateTotalPrice({
      ...baseParams,
      calendarEventTitle: 'Available (3)', // Rating 3
    })

    expect(result.ratingUsed).toBe(3)
    expect(result.ratingMultiplier).toBe(1.2) // +20% (2 points below 5)
    expect(result.finalMultiplier).toBe(1.2)
    expect(result.totalCents).toBe(6000) // $50 * 1.2 = $60
  })

  test('applies rating multiplier for rating > 5', () => {
    const result = calculateTotalPrice({
      ...baseParams,
      calendarEventTitle: 'Lauren Chen (7)', // Rating 7
    })

    expect(result.ratingUsed).toBe(7)
    expect(result.ratingMultiplier).toBe(0.9) // -10% (2 points above 5)
    expect(result.finalMultiplier).toBe(0.9)
    expect(result.totalCents).toBe(4500) // $50 * 0.9 = $45
  })

  test('applies rating multiplier for rating 10 (maximum discount)', () => {
    const result = calculateTotalPrice({
      ...baseParams,
      calendarEventTitle: 'Willingness 10/10', // Rating 10
    })

    expect(result.ratingUsed).toBe(10)
    expect(result.ratingMultiplier).toBe(0.75) // -25% (5 points above 5)
    expect(result.finalMultiplier).toBe(0.75)
    expect(result.totalCents).toBe(3750) // $50 * 0.75 = $37.50
  })

  test('applies rating multiplier for rating 1 (maximum surcharge)', () => {
    const result = calculateTotalPrice({
      ...baseParams,
      calendarEventTitle: 'Available 1', // Rating 1
    })

    expect(result.ratingUsed).toBe(1)
    expect(result.ratingMultiplier).toBe(1.4) // +40% (4 points below 5)
    expect(result.finalMultiplier).toBe(1.4)
    expect(result.totalCents).toBe(7000) // $50 * 1.4 = $70
  })

  test('combines lead time and rating multipliers', () => {
    const now = new Date()
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) // 24 hours

    const result = calculateTotalPrice({
      startDateTimeISO: oneDayFromNow.toISOString(),
      durationMinutes: 60,
      nowISO: now.toISOString(),
      calendarEventTitle: 'Available (8)', // Rating 8
    })

    expect(result.leadTimeMultiplier).toBe(1.1) // +10% (within 72 hours)
    expect(result.ratingMultiplier).toBe(0.85) // -15% (3 points above 5)
    expect(result.finalMultiplier).toBe(1.1 * 0.85) // 0.935
    expect(result.totalCents).toBe(Math.round(5000 * 1.1 * 0.85)) // $46.75
  })

  test('calculates price for 90-minute session', () => {
    const result = calculateTotalPrice({
      ...baseParams,
      durationMinutes: 90,
      calendarEventTitle: 'Available', // Rating 5
    })

    expect(result.totalCents).toBe(7500) // $50 * 1.5 hours = $75
  })

  test('rounds to nearest cent correctly', () => {
    // Test with multipliers that produce fractional cents
    const result = calculateTotalPrice({
      ...baseParams,
      durationMinutes: 60,
      calendarEventTitle: 'Available (6)', // Rating 6 = 0.95 multiplier
    })

    // $50 * 0.95 = $47.50, should round to 4750 cents
    expect(result.totalCents).toBe(4750)
    expect(result.totalCents % 1).toBe(0) // Should be integer
  })

  test('includes debug breakdown', () => {
    const result = calculateTotalPrice({
      ...baseParams,
      calendarEventTitle: 'Available (7)',
    })

    expect(result.debugBreakdown).toContain('Base: $50.00/hr')
    expect(result.debugBreakdown).toContain('Rating (7)')
    expect(result.debugBreakdown).toContain('Total:')
  })
})

