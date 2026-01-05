/**
 * Check if a time slot overlaps with any existing bookings
 */
export function hasOverlap(
  slotStart: Date,
  slotEnd: Date,
  bookings: Array<{ start: Date; end: Date }>
): boolean {
  return bookings.some(booking => {
    return (
      (slotStart >= booking.start && slotStart < booking.end) ||
      (slotEnd > booking.start && slotEnd <= booking.end) ||
      (slotStart <= booking.start && slotEnd >= booking.end)
    )
  })
}

/**
 * Check if two time ranges overlap
 */
export function rangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

