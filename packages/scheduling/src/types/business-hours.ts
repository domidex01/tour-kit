import type { DayOfWeek, TimeRange } from './schedule'

/**
 * Hours configuration for a single day
 */
export interface DayHours {
  /** Whether the business is open on this day */
  open: boolean
  /** Time ranges when open (allows for split hours like lunch breaks) */
  hours?: TimeRange[]
}

/**
 * Business hours configuration mapped by day of week
 */
export type BusinessHoursMap = {
  [K in DayOfWeek]?: DayHours
}

/**
 * Complete business hours configuration
 */
export interface BusinessHours {
  /** Default hours for days not explicitly configured */
  default?: DayHours
  /** Hours by day of week */
  days?: BusinessHoursMap
  /** Override timezone (IANA timezone name) */
  timezone?: string
  /** Holidays or closure dates */
  holidays?: string[] // YYYY-MM-DD format
}

/**
 * Preset business hours configurations
 */
export const BUSINESS_HOURS_PRESETS = {
  /** Standard 9-5, Monday-Friday */
  standard: {
    default: { open: false },
    days: {
      1: { open: true, hours: [{ start: '09:00', end: '17:00' }] },
      2: { open: true, hours: [{ start: '09:00', end: '17:00' }] },
      3: { open: true, hours: [{ start: '09:00', end: '17:00' }] },
      4: { open: true, hours: [{ start: '09:00', end: '17:00' }] },
      5: { open: true, hours: [{ start: '09:00', end: '17:00' }] },
    },
  } satisfies BusinessHours,

  /** Extended hours, Monday-Saturday */
  extended: {
    default: { open: false },
    days: {
      1: { open: true, hours: [{ start: '08:00', end: '20:00' }] },
      2: { open: true, hours: [{ start: '08:00', end: '20:00' }] },
      3: { open: true, hours: [{ start: '08:00', end: '20:00' }] },
      4: { open: true, hours: [{ start: '08:00', end: '20:00' }] },
      5: { open: true, hours: [{ start: '08:00', end: '20:00' }] },
      6: { open: true, hours: [{ start: '10:00', end: '18:00' }] },
    },
  } satisfies BusinessHours,

  /** 24/7 availability */
  always: {
    default: { open: true, hours: [{ start: '00:00', end: '23:59' }] },
  } satisfies BusinessHours,

  /** Weekdays only, all day */
  weekdaysOnly: {
    default: { open: false },
    days: {
      1: { open: true, hours: [{ start: '00:00', end: '23:59' }] },
      2: { open: true, hours: [{ start: '00:00', end: '23:59' }] },
      3: { open: true, hours: [{ start: '00:00', end: '23:59' }] },
      4: { open: true, hours: [{ start: '00:00', end: '23:59' }] },
      5: { open: true, hours: [{ start: '00:00', end: '23:59' }] },
    },
  } satisfies BusinessHours,
} as const

export type BusinessHoursPreset = keyof typeof BUSINESS_HOURS_PRESETS
