/**
 * Days of the week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Day names for configuration convenience
 */
export const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export type DayName = (typeof DAY_NAMES)[number]

/**
 * Time string in HH:MM format (24-hour)
 */
export type TimeString = `${string}:${string}`

/**
 * Time range for time-of-day constraints
 */
export interface TimeRange {
  /** Start time in HH:MM format (24-hour) */
  start: TimeString
  /** End time in HH:MM format (24-hour) */
  end: TimeString
}

/**
 * Date string in YYYY-MM-DD format
 */
export type DateString = `${string}-${string}-${string}`

/**
 * Date range for start/end date constraints
 */
export interface DateRange {
  /** Start date (inclusive) in YYYY-MM-DD format */
  start?: DateString
  /** End date (inclusive) in YYYY-MM-DD format */
  end?: DateString
}

/**
 * Blackout period when content should not be shown
 */
export interface BlackoutPeriod {
  /** Unique identifier for the blackout */
  id: string
  /** Start date/time of the blackout */
  start: DateString | Date
  /** End date/time of the blackout */
  end: DateString | Date
  /** Optional reason for the blackout */
  reason?: string
}

/**
 * Recurring pattern for scheduled content
 */
export interface RecurringPattern {
  /** Type of recurrence */
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  /** Interval between occurrences (e.g., every 2 weeks) */
  interval?: number
  /** For weekly: which days of the week */
  daysOfWeek?: DayOfWeek[]
  /** For monthly: which day of the month (1-31) */
  dayOfMonth?: number
  /** For yearly: which month (1-12) */
  month?: number
  /** Maximum number of occurrences */
  maxOccurrences?: number
  /** End date for the recurrence */
  endDate?: DateString
}

/**
 * Complete schedule configuration
 */
export interface Schedule {
  /** Schedule is enabled */
  enabled?: boolean

  /** Start date (inclusive) - content won't show before this date */
  startAt?: DateString | Date
  /** End date (inclusive) - content won't show after this date */
  endAt?: DateString | Date

  /** Days of the week when content can show (0=Sunday, 6=Saturday) */
  daysOfWeek?: DayOfWeek[]

  /** Time range during the day when content can show */
  timeOfDay?: TimeRange

  /** Use user's detected timezone (default: true) */
  useUserTimezone?: boolean
  /** Override timezone (IANA timezone name, e.g., 'America/New_York') */
  timezone?: string

  /** Blackout periods when content should not show */
  blackouts?: BlackoutPeriod[]

  /** Recurring pattern for the schedule */
  recurring?: RecurringPattern

  /** Custom metadata */
  metadata?: Record<string, unknown>
}

/**
 * Schedule evaluation options
 */
export interface ScheduleEvaluationOptions {
  /** Override the current date/time for testing */
  now?: Date
  /** User's detected timezone */
  userTimezone?: string
}
