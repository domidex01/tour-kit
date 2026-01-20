import type { Schedule, ScheduleEvaluationOptions, ScheduleResult } from '../types'
import { isInAnyBlackout } from './blackout'
import { isWithinDateRange } from './date-range'
import { isAllowedDay } from './day-of-week'
import { matchesRecurringPattern } from './recurring'
import { isWithinTimeRange } from './time-of-day'
import { getUserTimezone } from './timezone'

/**
 * Check if a schedule is currently active
 *
 * Evaluation order:
 * 1. Check if explicitly disabled
 * 2. Check date range (startAt / endAt)
 * 3. Check blackout periods
 * 4. Check day of week
 * 5. Check time of day
 * 6. Check recurring pattern
 *
 * @param schedule - The schedule configuration to evaluate
 * @param options - Evaluation options (override now, timezone)
 * @returns ScheduleResult with isActive and reason
 */
export function isScheduleActive(
  schedule: Schedule,
  options: ScheduleEvaluationOptions = {}
): ScheduleResult {
  const now = options.now ?? new Date()
  const timezone =
    schedule.timezone ??
    (schedule.useUserTimezone !== false ? (options.userTimezone ?? getUserTimezone()) : 'UTC')

  // 1. Check if explicitly disabled
  if (schedule.enabled === false) {
    return { isActive: false, reason: 'disabled' }
  }

  // 2. Check date range
  const dateRangeResult = isWithinDateRange(now, schedule.startAt, schedule.endAt, timezone)
  if (!dateRangeResult.isWithin) {
    return { isActive: false, reason: dateRangeResult.reason }
  }

  // 3. Check blackout periods
  if (schedule.blackouts && schedule.blackouts.length > 0) {
    if (isInAnyBlackout(now, schedule.blackouts)) {
      return { isActive: false, reason: 'blackout' }
    }
  }

  // 4. Check day of week
  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    if (!isAllowedDay(now, schedule.daysOfWeek, timezone)) {
      return { isActive: false, reason: 'wrong_day' }
    }
  }

  // 5. Check time of day
  if (schedule.timeOfDay) {
    if (!isWithinTimeRange(now, schedule.timeOfDay, timezone)) {
      return { isActive: false, reason: 'wrong_time' }
    }
  }

  // 6. Check recurring pattern
  if (schedule.recurring) {
    if (!matchesRecurringPattern(now, schedule.recurring, timezone, schedule.startAt)) {
      return { isActive: false, reason: 'recurring_mismatch' }
    }
  }

  // All checks passed
  return { isActive: true }
}

/**
 * Simple boolean check if schedule is active
 * @param schedule - The schedule configuration
 * @param options - Evaluation options
 * @returns true if active, false otherwise
 */
export function checkSchedule(schedule: Schedule, options?: ScheduleEvaluationOptions): boolean {
  return isScheduleActive(schedule, options).isActive
}
