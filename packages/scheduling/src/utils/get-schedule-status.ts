import type { Schedule, ScheduleEvaluationOptions, ScheduleStatus } from '../types'
import { getBlackoutEndTime, getCurrentBlackout } from './blackout'
import { getDateRangeStart } from './date-range'
import { getDayOfWeek, getNextAllowedDay } from './day-of-week'
import { isScheduleActive } from './is-schedule-active'
import { getNextTimeRangeStart } from './time-of-day'
import { formatDateString, getDateInTimezone, getUserTimezone } from './timezone'

/**
 * Get detailed schedule status with predictions
 *
 * @param schedule - The schedule configuration to evaluate
 * @param options - Evaluation options (override now, timezone)
 * @returns Detailed ScheduleStatus with next active/inactive times
 */
export function getScheduleStatus(
  schedule: Schedule,
  options: ScheduleEvaluationOptions = {}
): ScheduleStatus {
  const now = options.now ?? new Date()
  const timezone =
    schedule.timezone ??
    (schedule.useUserTimezone !== false ? (options.userTimezone ?? getUserTimezone()) : 'UTC')

  const result = isScheduleActive(schedule, options)
  const { hours, minutes } = getDateInTimezone(now, timezone)
  const dayOfWeek = getDayOfWeek(now, timezone)

  const baseStatus: ScheduleStatus = {
    isActive: result.isActive,
    reason: result.reason,
    debug: {
      evaluatedAt: now,
      timezone,
      localTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      dayOfWeek,
    },
  }

  // Add human-readable message
  baseStatus.message = getStatusMessage(result.reason, schedule, timezone, now)

  // Add next active time prediction
  if (!result.isActive) {
    baseStatus.nextActiveAt = predictNextActiveTime(schedule, now, timezone, result.reason)
  }

  // Add blackout details if in blackout
  if (result.reason === 'blackout' && schedule.blackouts) {
    const currentBlackout = getCurrentBlackout(now, schedule.blackouts)
    if (currentBlackout) {
      baseStatus.currentBlackout = {
        id: currentBlackout.id,
        reason: currentBlackout.reason,
        endsAt: getBlackoutEndTime(currentBlackout),
      }
    }
  }

  return baseStatus
}

/**
 * Get a human-readable message for the status
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: status message mapping with many reason variants
function getStatusMessage(
  reason: ScheduleStatus['reason'],
  schedule: Schedule,
  timezone: string,
  now: Date
): string {
  if (!reason) {
    return 'Schedule is currently active'
  }

  switch (reason) {
    case 'disabled':
      return 'Schedule is disabled'

    case 'not_started': {
      if (schedule.startAt) {
        const startStr =
          schedule.startAt instanceof Date
            ? formatDateString(schedule.startAt, timezone)
            : schedule.startAt
        return `Schedule starts on ${startStr}`
      }
      return 'Schedule has not started yet'
    }

    case 'ended': {
      if (schedule.endAt) {
        const endStr =
          schedule.endAt instanceof Date
            ? formatDateString(schedule.endAt, timezone)
            : schedule.endAt
        return `Schedule ended on ${endStr}`
      }
      return 'Schedule has ended'
    }

    case 'wrong_day': {
      const dayOfWeek = getDayOfWeek(now, timezone)
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]
      return `Not available on ${dayNames[dayOfWeek]}`
    }

    case 'wrong_time': {
      if (schedule.timeOfDay) {
        return `Available between ${schedule.timeOfDay.start} and ${schedule.timeOfDay.end}`
      }
      return 'Outside of scheduled time'
    }

    case 'blackout': {
      if (schedule.blackouts) {
        const currentBlackout = getCurrentBlackout(now, schedule.blackouts)
        if (currentBlackout?.reason) {
          return `Unavailable: ${currentBlackout.reason}`
        }
      }
      return 'Currently in a blackout period'
    }

    case 'outside_business_hours':
      return 'Outside of business hours'

    case 'recurring_mismatch':
      return 'Does not match recurring schedule'

    default:
      return 'Schedule is not active'
  }
}

/**
 * Predict when the schedule will next become active
 */
function predictNextActiveTime(
  schedule: Schedule,
  now: Date,
  timezone: string,
  reason: ScheduleStatus['reason']
): Date | undefined {
  switch (reason) {
    case 'disabled':
      return undefined // Can't predict

    case 'not_started':
      return getDateRangeStart(schedule.startAt)

    case 'ended':
      return undefined // Won't become active again

    case 'wrong_day':
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        return getNextAllowedDay(now, schedule.daysOfWeek, timezone)
      }
      return undefined

    case 'wrong_time':
      if (schedule.timeOfDay) {
        return getNextTimeRangeStart(now, schedule.timeOfDay, timezone)
      }
      return undefined

    case 'blackout':
      if (schedule.blackouts) {
        const currentBlackout = getCurrentBlackout(now, schedule.blackouts)
        if (currentBlackout) {
          const endsAt = getBlackoutEndTime(currentBlackout)
          // Add 1 second to get past the blackout
          return new Date(endsAt.getTime() + 1000)
        }
      }
      return undefined

    default:
      return undefined
  }
}
