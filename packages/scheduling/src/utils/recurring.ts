import type { DateString, RecurringPattern } from '../types'
import { getDayOfWeek } from './day-of-week'
import { formatDateString, getDateInTimezone, parseDateString } from './timezone'

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
  // Check end date. Compare date-only strings in the schedule's timezone so the
  // end date is inclusive of the whole day (matching `isWithinDateRange`). A raw
  // `date > parseDateString(endDate)` would treat endDate as UTC midnight and
  // reject the entire final day except that one instant — and ignore `timezone`.
  if (pattern.endDate) {
    if (formatDateString(date, timezone) > pattern.endDate) {
      return false
    }
  }

  // Cap by maxOccurrences, counted from startDate in the schedule timezone.
  // Needs an anchor to count from — without startDate the cap can't apply.
  if (pattern.maxOccurrences !== undefined && startDate !== undefined) {
    if (countOccurrencesBefore(date, pattern, timezone, startDate) >= pattern.maxOccurrences) {
      return false
    }
  }

  return matchesPatternType(date, pattern, timezone, startDate)
}

/**
 * Match a date against the pattern's per-type rule (day/week/month/year).
 * `endDate` and `maxOccurrences` are handled by `matchesRecurringPattern`.
 */
function matchesPatternType(
  date: Date,
  pattern: RecurringPattern,
  timezone: string,
  startDate?: DateString | Date
): boolean {
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

const MS_PER_DAY = 86_400_000

/**
 * Count pattern occurrences strictly before `date`, starting from `startDate`,
 * evaluated in the schedule timezone.
 *
 * The window [start, date) is derived from timezone-local calendar-date strings,
 * and each candidate day is matched in UTC — where its UTC components equal that
 * calendar date — so the existing per-type interval math stays correct across
 * timezones. The walk short-circuits once the count reaches `maxOccurrences`
 * (we only need to know whether the cap is hit), so it allocates nothing and
 * never enumerates a full date array — the 483 B byte budget depends on this.
 */
function countOccurrencesBefore(
  date: Date,
  pattern: RecurringPattern,
  timezone: string,
  startDate: DateString | Date
): number {
  // `formatDateString` yields a valid YYYY-MM-DD, so the narrowing to
  // `DateString` is sound (it just isn't inferable from the `string` return).
  const startStr = (
    typeof startDate === 'string' ? startDate : formatDateString(startDate, timezone)
  ) as DateString
  const startMidnight = parseDateString(startStr)
  const targetMidnight = parseDateString(formatDateString(date, timezone))
  const dayDiff = Math.round((targetMidnight.getTime() - startMidnight.getTime()) / MS_PER_DAY)
  const max = pattern.maxOccurrences ?? Number.POSITIVE_INFINITY

  let count = 0
  for (let offset = 0; offset < dayDiff && count < max; offset++) {
    const candidate = new Date(startMidnight.getTime() + offset * MS_PER_DAY)
    if (matchesPatternType(candidate, pattern, 'UTC', startStr)) {
      count++
    }
  }
  return count
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
