import type { BlackoutPeriod } from '../types'
import { parseDateString } from './timezone'

/**
 * Normalize a blackout period date to a Date object
 */
function normalizeBlackoutDate(date: string | Date): Date {
  if (date instanceof Date) return date
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
export function getCurrentBlackout(date: Date, blackouts: BlackoutPeriod[]): BlackoutPeriod | undefined {
  return blackouts.find((blackout) => isInBlackoutPeriod(date, blackout))
}

/**
 * Check if a date is in any blackout period
 */
export function isInAnyBlackout(date: Date, blackouts: BlackoutPeriod[]): boolean {
  return blackouts.some((blackout) => isInBlackoutPeriod(date, blackout))
}

/**
 * Get the next blackout period start after a given date
 */
export function getNextBlackout(date: Date, blackouts: BlackoutPeriod[]): BlackoutPeriod | undefined {
  const futureBlackouts = blackouts
    .map((blackout) => ({
      ...blackout,
      startDate: normalizeBlackoutDate(blackout.start),
    }))
    .filter((b) => b.startDate > date)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  return futureBlackouts[0]
}

/**
 * Get when the current blackout ends
 */
export function getBlackoutEndTime(blackout: BlackoutPeriod): Date {
  const end = normalizeBlackoutDate(blackout.end)
  end.setUTCHours(23, 59, 59, 999)
  return end
}

/**
 * Filter out past blackouts
 */
export function getActiveBlackouts(blackouts: BlackoutPeriod[], now: Date): BlackoutPeriod[] {
  return blackouts.filter((blackout) => {
    const end = normalizeBlackoutDate(blackout.end)
    end.setUTCHours(23, 59, 59, 999)
    return end >= now
  })
}
