'use client'

import { useState, useEffect } from 'react'
import { generateTimeSlots, getWeekDates, startOfWeek, addDays, formatWeekRange, isSlotAvailable, createDateTime, type TimeSlot, type CalendarDay } from '@/lib/calendarUtils'
import styles from './WeeklyCalendarGrid.module.css'

interface WeeklyCalendarGridProps {
  availableSlots?: string[] // ISO datetime strings from API
  selectedSlot: string | null // ISO datetime string
  onSlotSelect: (isoString: string) => void
  calendarNotConnected?: boolean
  tutorName?: string
  startHour?: number
  endHour?: number
}

export default function WeeklyCalendarGrid({
  availableSlots = [],
  selectedSlot,
  onSlotSelect,
  calendarNotConnected = false,
  tutorName,
  startHour = 9,
  endHour = 20
}: WeeklyCalendarGridProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()))
  const [timeSlots] = useState(() => generateTimeSlots(startHour, endHour, 30))
  const [weekDays, setWeekDays] = useState<CalendarDay[]>(() => getWeekDates(currentWeekStart))
  const [mobileDayOffset, setMobileDayOffset] = useState(0) // For mobile day scrolling

  useEffect(() => {
    setWeekDays(getWeekDates(currentWeekStart))
  }, [currentWeekStart])

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7))
  }

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date()))
    setMobileDayOffset(0)
  }

  const handlePrevDay = () => {
    setMobileDayOffset(prev => Math.max(0, prev - 1))
  }

  const handleNextDay = () => {
    setMobileDayOffset(prev => Math.min(4, prev + 1)) // Max 4 to show days 0-6
  }

  // Reset mobile offset when week changes
  useEffect(() => {
    setMobileDayOffset(0)
  }, [currentWeekStart])

  const handleSlotClick = (day: CalendarDay, slot: TimeSlot) => {
    if (calendarNotConnected) return
    
    const dateTime = createDateTime(day.date, slot)
    const isoString = dateTime.toISOString()
    
    // Check if slot is available
    if (isSlotAvailable(dateTime, availableSlots)) {
      onSlotSelect(isoString)
    }
  }

  const isSlotSelected = (day: CalendarDay, slot: TimeSlot): boolean => {
    if (!selectedSlot) return false
    const dateTime = createDateTime(day.date, slot)
    const selectedDate = new Date(selectedSlot)
    return dateTime.getTime() === selectedDate.getTime()
  }

  const getSelectedSlotDetails = () => {
    if (!selectedSlot) return null
    
    const date = new Date(selectedSlot)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const selectedDetails = getSelectedSlotDetails()

  return (
    <div className={styles.calendarContainer}>
      {/* Navigation */}
      <div className={styles.navigation}>
        <button 
          className={styles.navButton}
          onClick={handlePrevWeek}
          aria-label="Previous week"
        >
          ← Prev
        </button>
        <div className={styles.weekRange}>
          {formatWeekRange(currentWeekStart)}
        </div>
        <button 
          className={styles.navButton}
          onClick={handleNextWeek}
          aria-label="Next week"
        >
          Next →
        </button>
        <button 
          className={styles.todayButton}
          onClick={handleToday}
        >
          Today
        </button>
      </div>

      {/* Calendar Not Connected Notice */}
      {calendarNotConnected && (
        <div className={styles.notice}>
          <p>
            {tutorName ? `${tutorName}'s` : 'The'} calendar is being finalized. 
            Your request will be confirmed after payment.
          </p>
        </div>
      )}

      {/* Mobile Day Navigation */}
      <div className={styles.mobileDayNav}>
        <button 
          className={styles.mobileNavButton}
          onClick={handlePrevDay}
          disabled={mobileDayOffset === 0}
          aria-label="Previous days"
        >
          ←
        </button>
        <div className={styles.mobileDayRange}>
          {weekDays.length > 0 && mobileDayOffset < weekDays.length && (
            <>
              {weekDays[mobileDayOffset]?.dayName} {weekDays[mobileDayOffset]?.dayNumber} – {weekDays[Math.min(mobileDayOffset + 2, weekDays.length - 1)]?.dayName} {weekDays[Math.min(mobileDayOffset + 2, weekDays.length - 1)]?.dayNumber}
            </>
          )}
        </div>
        <button 
          className={styles.mobileNavButton}
          onClick={handleNextDay}
          disabled={mobileDayOffset >= 4}
          aria-label="Next days"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarWrapper}>
        <div className={styles.calendarGrid} data-mobile-offset={mobileDayOffset}>
          {/* Time Gutter */}
          <div className={styles.timeGutter}>
            <div className={styles.timeGutterHeader}></div>
            {timeSlots.map((slot, idx) => (
              <div key={idx} className={styles.timeGutterCell}>
                {slot.display}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {/* On mobile, CSS will hide days outside the visible range */}
          {weekDays.map((day, dayIdx) => {
            const isVisibleOnMobile = dayIdx >= mobileDayOffset && dayIdx < mobileDayOffset + 3
            return (
            <div 
              key={dayIdx} 
              className={`${styles.dayColumn} ${isVisibleOnMobile ? styles.mobileVisible : styles.mobileHidden}`}
            >
              {/* Day Header */}
              <div className={`${styles.dayHeader} ${day.isToday ? styles.today : ''}`}>
                <div className={styles.dayName}>{day.dayName}</div>
                <div className={styles.dayNumber}>{day.dayNumber}</div>
                <div className={styles.dayMonth}>{day.month}</div>
              </div>

              {/* Time Slots */}
              {timeSlots.map((slot, slotIdx) => {
                const dateTime = createDateTime(day.date, slot)
                const available = !calendarNotConnected && isSlotAvailable(dateTime, availableSlots)
                const selected = isSlotSelected(day, slot)
                const isPast = day.isPast || (day.isToday && dateTime < new Date())

                return (
                  <button
                    key={slotIdx}
                    className={`
                      ${styles.timeSlotCell}
                      ${available ? styles.available : ''}
                      ${selected ? styles.selected : ''}
                      ${isPast ? styles.past : ''}
                    `}
                    onClick={() => handleSlotClick(day, slot)}
                    disabled={!available || isPast || calendarNotConnected}
                    aria-label={`${day.dayName} ${slot.display}`}
                  >
                    {selected && <span className={styles.selectedIndicator}>✓</span>}
                  </button>
                )
              })}
            </div>
            )
          })}
        </div>
      </div>

      {/* Selected Slot Details */}
      {selectedDetails && (
        <div className={styles.selectedDetails}>
          <div className={styles.selectedInfo}>
            <strong>Selected:</strong> {selectedDetails.date} at {selectedDetails.time}
            {tutorName && <span className={styles.tutorName}> with {tutorName}</span>}
          </div>
        </div>
      )}

      {/* Timezone Label */}
      <div className={styles.timezoneLabel}>
        All times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </div>
    </div>
  )
}

