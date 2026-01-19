import type { DateString, RecurringPattern } from '../types'
import { getDayOfWeek } from './day-of-week'
import { getDateInTimezone, parseDateString } from './timezone'

/**
 * Check if a date matches a recurring pattern
 * @param date - The date to check
 * @param pattern - The recurring pattern
 * @param timezone - Timezone for date calculations
 * @param startDate - When the recurrence started (for interval calculations)
 * @returns Whether the date matches the pattern
 */
export function matchesRecurringPattern(
  date: Date,
  pattern: RecurringPattern,
  timezone: string,
  startDate?: DateString | Date
): boolean {
  // Check end date
  if (pattern.endDate) {
    const endDate = parseDateString(pattern.endDate)
    if (date > endDate) {
      return false
    }
  }

  const { day, month } = getDateInTimezone(date, timezone)
  const dayOfWeek = getDayOfWeek(date, timezone)

  switch (pattern.type) {
    case 'daily':
      return matchesDailyPattern(date, pattern, startDate)

    case 'weekly':
      return matchesWeeklyPattern(dayOfWeek, pattern, date, startDate)

    case 'monthly':
      return matchesMonthlyPattern(day, pattern, date, startDate)

    case 'yearly':
      return matchesYearlyPattern(day, month, pattern, date, startDate)

    default:
      return false
  }
}

/**
 * Check if a date matches a daily recurring pattern
 */
function matchesDailyPattern(
  date: Date,
  pattern: RecurringPattern,
  startDate?: DateString | Date
): boolean {
  const interval = pattern.interval ?? 1

  if (interval === 1) {
    return true // Every day
  }

  // Calculate days since start
  const start = startDate
    ? startDate instanceof Date
      ? startDate
      : parseDateString(startDate)
    : new Date(0) // Epoch if no start

  const daysSinceStart = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  return daysSinceStart % interval === 0
}

/**
 * Check if a date matches a weekly recurring pattern
 */
function matchesWeeklyPattern(
  dayOfWeek: number,
  pattern: RecurringPattern,
  date: Date,
  startDate?: DateString | Date
): boolean {
  // Check day of week constraint
  if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
    if (!pattern.daysOfWeek.includes(dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
      return false
    }
  }

  const interval = pattern.interval ?? 1

  if (interval === 1) {
    return true // Every week
  }

  // Calculate weeks since start
  const start = startDate
    ? startDate instanceof Date
      ? startDate
      : parseDateString(startDate)
    : new Date(0)

  const weeksSinceStart = Math.floor((date.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weeksSinceStart % interval === 0
}

/**
 * Check if a date matches a monthly recurring pattern
 */
function matchesMonthlyPattern(
  dayOfMonth: number,
  pattern: RecurringPattern,
  date: Date,
  startDate?: DateString | Date
): boolean {
  // Check day of month constraint
  if (pattern.dayOfMonth !== undefined) {
    if (dayOfMonth !== pattern.dayOfMonth) {
      return false
    }
  }

  const interval = pattern.interval ?? 1

  if (interval === 1) {
    return true // Every month
  }

  // Calculate months since start
  const start = startDate
    ? startDate instanceof Date
      ? startDate
      : parseDateString(startDate)
    : new Date(0)

  const startYear = start.getUTCFullYear()
  const startMonth = start.getUTCMonth()
  const currentYear = date.getUTCFullYear()
  const currentMonth = date.getUTCMonth()

  const monthsSinceStart = (currentYear - startYear) * 12 + (currentMonth - startMonth)
  return monthsSinceStart % interval === 0
}

/**
 * Check if a date matches a yearly recurring pattern
 */
function matchesYearlyPattern(
  dayOfMonth: number,
  month: number,
  pattern: RecurringPattern,
  date: Date,
  startDate?: DateString | Date
): boolean {
  // Check month constraint
  if (pattern.month !== undefined) {
    if (month !== pattern.month) {
      return false
    }
  }

  // Check day of month constraint
  if (pattern.dayOfMonth !== undefined) {
    if (dayOfMonth !== pattern.dayOfMonth) {
      return false
    }
  }

  const interval = pattern.interval ?? 1

  if (interval === 1) {
    return true // Every year
  }

  // Calculate years since start
  const start = startDate
    ? startDate instanceof Date
      ? startDate
      : parseDateString(startDate)
    : new Date(0)

  const yearsSinceStart = date.getUTCFullYear() - start.getUTCFullYear()
  return yearsSinceStart % interval === 0
}
