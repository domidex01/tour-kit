import type { DayName, DayOfWeek } from '../types'
import { DAY_NAMES } from '../types'
import { getDateInTimezone } from './timezone'

/**
 * Get the day of week (0-6, Sunday=0) for a date in a timezone
 */
export function getDayOfWeek(date: Date, timezone: string): DayOfWeek {
  const { dayOfWeek } = getDateInTimezone(date, timezone)
  return dayOfWeek as DayOfWeek
}

/**
 * Check if the current day is in the allowed days
 */
export function isAllowedDay(date: Date, allowedDays: DayOfWeek[], timezone: string): boolean {
  const dayOfWeek = getDayOfWeek(date, timezone)
  return allowedDays.includes(dayOfWeek)
}

/**
 * Convert day name to day number
 */
export function dayNameToNumber(name: DayName): DayOfWeek {
  const index = DAY_NAMES.indexOf(name)
  return index as DayOfWeek
}

/**
 * Convert day number to day name
 */
export function dayNumberToName(day: DayOfWeek): DayName {
  return DAY_NAMES[day]
}

/**
 * Get the next occurrence of a specific day
 * @param date - Current date
 * @param targetDay - Target day of week (0-6)
 * @param timezone - Timezone
 * @returns Date of the next occurrence of that day
 */
export function getNextDayOccurrence(date: Date, targetDay: DayOfWeek, timezone: string): Date {
  const currentDay = getDayOfWeek(date, timezone)
  let daysUntil = targetDay - currentDay

  if (daysUntil <= 0) {
    daysUntil += 7 // Next week
  }

  const nextDate = new Date(date.getTime())
  nextDate.setDate(nextDate.getDate() + daysUntil)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

/**
 * Get the next allowed day from a list
 * @param date - Current date
 * @param allowedDays - List of allowed days (0-6)
 * @param timezone - Timezone
 * @returns The next allowed date, or undefined if no days allowed
 */
export function getNextAllowedDay(
  date: Date,
  allowedDays: DayOfWeek[],
  timezone: string
): Date | undefined {
  if (allowedDays.length === 0) return undefined

  const currentDay = getDayOfWeek(date, timezone)

  // Find the next allowed day
  let minDaysAhead = 8 // More than a week

  for (const allowedDay of allowedDays) {
    let daysAhead = allowedDay - currentDay
    if (daysAhead <= 0) {
      daysAhead += 7
    }
    if (daysAhead < minDaysAhead) {
      minDaysAhead = daysAhead
    }
  }

  if (minDaysAhead > 7) return undefined

  const nextDate = new Date(date.getTime())
  nextDate.setDate(nextDate.getDate() + minDaysAhead)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

/**
 * Common day groups
 */
export const DAY_GROUPS = {
  weekdays: [1, 2, 3, 4, 5] as DayOfWeek[],
  weekends: [0, 6] as DayOfWeek[],
  all: [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[],
} as const
