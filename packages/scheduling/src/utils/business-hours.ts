import type { BusinessHours, DayOfWeek } from '../types'
import { getDayOfWeek } from './day-of-week'
import { isWithinAnyTimeRange } from './time-of-day'
import { formatDateString } from './timezone'

/**
 * Check if a date/time is within business hours
 * @param date - The date/time to check
 * @param businessHours - Business hours configuration
 * @param timezone - Timezone to use (defaults to businessHours.timezone or user's timezone)
 * @returns Whether the time is within business hours
 */
export function isWithinBusinessHours(
  date: Date,
  businessHours: BusinessHours,
  timezone?: string
): boolean {
  const tz = timezone || businessHours.timezone || 'UTC'
  const dayOfWeek = getDayOfWeek(date, tz)

  // Check holidays first
  if (businessHours.holidays && businessHours.holidays.length > 0) {
    const dateStr = formatDateString(date, tz)
    if (businessHours.holidays.includes(dateStr)) {
      return false
    }
  }

  // Get day configuration
  const dayConfig = businessHours.days?.[dayOfWeek as DayOfWeek] ?? businessHours.default

  // No configuration for this day
  if (!dayConfig) {
    return false
  }

  // Day is closed
  if (!dayConfig.open) {
    return false
  }

  // No specific hours = open all day
  if (!dayConfig.hours || dayConfig.hours.length === 0) {
    return true
  }

  // Check if current time is within any of the hour ranges
  return isWithinAnyTimeRange(date, dayConfig.hours, tz)
}

/**
 * Get business hours status for a day
 */
export function getDayBusinessHours(
  dayOfWeek: DayOfWeek,
  businessHours: BusinessHours
): { isOpen: boolean; hours: Array<{ start: string; end: string }> } {
  const dayConfig = businessHours.days?.[dayOfWeek] ?? businessHours.default

  if (!dayConfig || !dayConfig.open) {
    return { isOpen: false, hours: [] }
  }

  return {
    isOpen: true,
    hours: dayConfig.hours ?? [{ start: '00:00', end: '23:59' }],
  }
}

/**
 * Check if a specific date is a holiday
 */
export function isHoliday(date: Date, businessHours: BusinessHours, timezone?: string): boolean {
  if (!businessHours.holidays || businessHours.holidays.length === 0) {
    return false
  }
  const tz = timezone || businessHours.timezone || 'UTC'
  const dateStr = formatDateString(date, tz)
  return businessHours.holidays.includes(dateStr)
}
