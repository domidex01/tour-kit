import type { TimeRange } from '../types'
import { getCurrentMinutesInTimezone, parseTimeString, toMinutesSinceMidnight } from './timezone'

/**
 * Check if the current time is within a time range
 * @param date - The date/time to check
 * @param timeRange - The time range to check against
 * @param timezone - Timezone for time calculation
 * @returns Whether the time is within the range
 */
export function isWithinTimeRange(date: Date, timeRange: TimeRange, timezone: string): boolean {
  const currentMinutes = getCurrentMinutesInTimezone(date, timezone)

  const startTime = parseTimeString(timeRange.start)
  const endTime = parseTimeString(timeRange.end)

  const startMinutes = toMinutesSinceMidnight(startTime.hours, startTime.minutes)
  const endMinutes = toMinutesSinceMidnight(endTime.hours, endTime.minutes)

  // Handle overnight ranges (e.g., 22:00 to 06:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * Check if the current time is within any of multiple time ranges
 * @param date - The date/time to check
 * @param timeRanges - Array of time ranges to check against
 * @param timezone - Timezone for time calculation
 * @returns Whether the time is within any of the ranges
 */
export function isWithinAnyTimeRange(date: Date, timeRanges: TimeRange[], timezone: string): boolean {
  return timeRanges.some((range) => isWithinTimeRange(date, range, timezone))
}

/**
 * Get the next time a time range will start
 * @param date - Current date/time
 * @param timeRange - The time range
 * @param timezone - Timezone
 * @returns The next start time, or undefined if already in range
 */
export function getNextTimeRangeStart(date: Date, timeRange: TimeRange, timezone: string): Date | undefined {
  if (isWithinTimeRange(date, timeRange, timezone)) {
    return undefined // Already in range
  }

  const currentMinutes = getCurrentMinutesInTimezone(date, timezone)
  const startTime = parseTimeString(timeRange.start)
  const startMinutes = toMinutesSinceMidnight(startTime.hours, startTime.minutes)

  // Calculate minutes until start
  let minutesUntilStart: number
  if (currentMinutes < startMinutes) {
    minutesUntilStart = startMinutes - currentMinutes
  } else {
    // Start is tomorrow
    minutesUntilStart = 24 * 60 - currentMinutes + startMinutes
  }

  const nextStart = new Date(date.getTime() + minutesUntilStart * 60 * 1000)
  return nextStart
}
