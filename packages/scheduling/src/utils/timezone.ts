import type { TimeString } from '../types'

/**
 * Get the user's timezone from the browser
 * Falls back to UTC if not available
 */
export function getUserTimezone(): string {
  if (typeof Intl === 'undefined') {
    return 'UTC'
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Check if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Convert a date to a specific timezone and return components
 */
export function getDateInTimezone(
  date: Date,
  timezone: string
): {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
  dayOfWeek: number
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(date)
  const partMap: Record<string, string> = {}
  for (const part of parts) {
    partMap[part.type] = part.value
  }

  // Map weekday to number (0 = Sunday)
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    year: Number.parseInt(partMap.year, 10),
    month: Number.parseInt(partMap.month, 10),
    day: Number.parseInt(partMap.day, 10),
    hours: Number.parseInt(partMap.hour, 10),
    minutes: Number.parseInt(partMap.minute, 10),
    seconds: Number.parseInt(partMap.second, 10),
    dayOfWeek: weekdayMap[partMap.weekday] ?? 0,
  }
}

/**
 * Parse a time string (HH:MM) into hours and minutes
 */
export function parseTimeString(time: TimeString): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = time.split(':')
  return {
    hours: Number.parseInt(hoursStr, 10),
    minutes: Number.parseInt(minutesStr, 10),
  }
}

/**
 * Convert hours and minutes to total minutes since midnight
 */
export function toMinutesSinceMidnight(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

/**
 * Get current time as minutes since midnight in a timezone
 */
export function getCurrentMinutesInTimezone(date: Date, timezone: string): number {
  const { hours, minutes } = getDateInTimezone(date, timezone)
  return toMinutesSinceMidnight(hours, minutes)
}

/**
 * Format a date to YYYY-MM-DD string in a timezone
 */
export function formatDateString(date: Date, timezone: string): string {
  const { year, month, day } = getDateInTimezone(date, timezone)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object at midnight UTC
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}
