import type { DateString } from '../types'
import { formatDateString, parseDateString } from './timezone'

/**
 * Check if a date is within a date range
 * @param date - The date to check
 * @param startDate - Start date (inclusive), undefined means no start constraint
 * @param endDate - End date (inclusive), undefined means no end constraint
 * @param timezone - Timezone for date comparison
 * @returns Object with isWithin boolean and reason if outside
 */
export function isWithinDateRange(
  date: Date,
  startDate: DateString | Date | undefined,
  endDate: DateString | Date | undefined,
  timezone: string
): { isWithin: boolean; reason?: 'not_started' | 'ended' } {
  const currentDateStr = formatDateString(date, timezone)

  // Check start date
  if (startDate) {
    const startStr = startDate instanceof Date ? formatDateString(startDate, timezone) : startDate
    if (currentDateStr < startStr) {
      return { isWithin: false, reason: 'not_started' }
    }
  }

  // Check end date
  if (endDate) {
    const endStr = endDate instanceof Date ? formatDateString(endDate, timezone) : endDate
    if (currentDateStr > endStr) {
      return { isWithin: false, reason: 'ended' }
    }
  }

  return { isWithin: true }
}

/**
 * Calculate when a date range will start (if not started)
 */
export function getDateRangeStart(startDate: DateString | Date | undefined): Date | undefined {
  if (!startDate) return undefined
  return startDate instanceof Date ? startDate : parseDateString(startDate)
}
