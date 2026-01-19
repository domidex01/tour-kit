// Types
export type {
  BlackoutPeriod,
  BusinessHours,
  BusinessHoursMap,
  BusinessHoursPreset,
  DateRange,
  DateString,
  DayHours,
  DayName,
  DayOfWeek,
  RecurringPattern,
  Schedule,
  ScheduleEvaluationOptions,
  ScheduleInactiveReason,
  ScheduleResult,
  ScheduleStatus,
  TimeRange,
  TimeString,
} from './types'

// Constants
export { BUSINESS_HOURS_PRESETS, DAY_NAMES } from './types'

// Core utilities
export {
  // Main evaluation functions
  checkSchedule,
  isScheduleActive,
  getScheduleStatus,
  // Timezone utilities
  formatDateString,
  getDateInTimezone,
  getUserTimezone,
  isValidTimezone,
  parseDateString,
  parseTimeString,
  // Date range utilities
  isWithinDateRange,
  // Time of day utilities
  isWithinTimeRange,
  isWithinAnyTimeRange,
  // Day of week utilities
  DAY_GROUPS,
  getDayOfWeek,
  isAllowedDay,
  dayNameToNumber,
  dayNumberToName,
  // Blackout utilities
  isInBlackoutPeriod,
  isInAnyBlackout,
  getCurrentBlackout,
  getBlackoutEndTime,
  // Business hours utilities
  isWithinBusinessHours,
  isHoliday,
  getDayBusinessHours,
  // Recurring pattern utilities
  matchesRecurringPattern,
} from './utils'

// React hooks
export {
  useUserTimezone,
  useSchedule,
  useScheduleStatus,
  type UseScheduleOptions,
  type UseScheduleReturn,
  type UseScheduleStatusOptions,
  type UseScheduleStatusReturn,
} from './hooks'
