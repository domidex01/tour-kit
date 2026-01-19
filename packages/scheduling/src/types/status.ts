/**
 * Reason why a schedule is inactive
 */
export type ScheduleInactiveReason =
  | 'disabled' // Schedule explicitly disabled
  | 'not_started' // Before start date
  | 'ended' // After end date
  | 'wrong_day' // Not on allowed day of week
  | 'wrong_time' // Outside allowed time range
  | 'blackout' // In a blackout period
  | 'outside_business_hours' // Outside business hours
  | 'recurring_mismatch' // Doesn't match recurring pattern

/**
 * Schedule status with detailed information
 */
export interface ScheduleStatus {
  /** Whether the schedule is currently active */
  isActive: boolean

  /** Reason for being inactive (undefined if active) */
  reason?: ScheduleInactiveReason

  /** Human-readable explanation */
  message?: string

  /** When the schedule will next become active (if predictable) */
  nextActiveAt?: Date

  /** When the schedule will next become inactive (if currently active) */
  nextInactiveAt?: Date

  /** Current blackout period if in one */
  currentBlackout?: {
    id: string
    reason?: string
    endsAt: Date
  }

  /** Debug information */
  debug?: {
    evaluatedAt: Date
    timezone: string
    localTime: string
    dayOfWeek: number
  }
}

/**
 * Simplified active/inactive result
 */
export interface ScheduleResult {
  /** Whether the schedule is currently active */
  isActive: boolean
  /** Quick reason code */
  reason?: ScheduleInactiveReason
}
