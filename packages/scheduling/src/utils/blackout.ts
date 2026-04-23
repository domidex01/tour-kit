import type { BlackoutPeriod } from '../types'
import { parseDateString } from './timezone'

/**
 * Normalize a blackout period date to a Date object
 */
function normalizeBlackoutDate(date: string | Date): Date {
  if (date instanceof Date) return new Date(date.getTime())
  return parseDateString(date)
}

/**
 * Check if a date is within a blackout period
 */
export function isInBlackoutPeriod(date: Date, blackout: BlackoutPeriod): boolean {
  const start = normalizeBlackoutDate(blackout.start)
  const end = normalizeBlackoutDate(blackout.end)

  // Set end to end of day
  end.setUTCHours(23, 59, 59, 999)

  return date >= start && date <= end
}

/**
 * Find the current blackout period (if any)
 */
export function getCurrentBlackout(
  date: Date,
  blackouts: BlackoutPeriod[]
): BlackoutPeriod | undefined {
  return blackouts.find((blackout) => isInBlackoutPeriod(date, blackout))
}

/**
 * Check if a date is in any blackout period
 */
export function isInAnyBlackout(date: Date, blackouts: BlackoutPeriod[]): boolean {
  return blackouts.some((blackout) => isInBlackoutPeriod(date, blackout))
}

/**
 * Get when the current blackout ends
 */
export function getBlackoutEndTime(blackout: BlackoutPeriod): Date {
  const end = normalizeBlackoutDate(blackout.end)
  end.setUTCHours(23, 59, 59, 999)
  return end
}
