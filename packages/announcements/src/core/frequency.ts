import type { AnnouncementState, FrequencyRule } from '../types/announcement'

/**
 * Check if an announcement can be shown based on frequency rules
 */
export function canShowByFrequency(
  state: AnnouncementState,
  rule: FrequencyRule | undefined
): boolean {
  // No rule means always show
  if (!rule) {
    return true
  }

  // Handle string rules
  if (typeof rule === 'string') {
    switch (rule) {
      case 'once':
        // Only show if never viewed
        return state.viewCount === 0

      case 'session':
        // Session tracking is handled by the provider (no persistence)
        // If dismissed this session, don't show again
        return !state.isDismissed

      case 'always':
        // Always show unless currently dismissed
        return !state.isDismissed

      default:
        return true
    }
  }

  // Handle object rules
  switch (rule.type) {
    case 'times':
      // Show up to N times
      return state.viewCount < rule.count

    case 'interval': {
      // Show every N days
      if (state.viewCount === 0) {
        return true
      }
      if (!state.lastViewedAt) {
        return true
      }
      const daysSinceLastView = getDaysDifference(state.lastViewedAt, new Date())
      return daysSinceLastView >= rule.days
    }

    default:
      return true
  }
}

/**
 * Calculate days between two dates
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const time1 = date1.getTime()
  const time2 = date2.getTime()
  return Math.floor(Math.abs(time2 - time1) / msPerDay)
}

/**
 * Check if frequency rule allows showing after dismissal
 */
export function canShowAfterDismissal(rule: FrequencyRule | undefined): boolean {
  if (!rule) {
    return true
  }

  if (typeof rule === 'string') {
    switch (rule) {
      case 'once':
        return false
      case 'session':
        return false
      case 'always':
        return true
      default:
        return true
    }
  }

  // Object rules generally allow reshowing
  return true
}

/**
 * Get the effective view limit for a frequency rule
 */
export function getViewLimit(rule: FrequencyRule | undefined): number {
  if (!rule) {
    return Number.POSITIVE_INFINITY
  }

  if (typeof rule === 'string') {
    switch (rule) {
      case 'once':
        return 1
      case 'session':
        return Number.POSITIVE_INFINITY // Handled per session
      case 'always':
        return Number.POSITIVE_INFINITY
      default:
        return Number.POSITIVE_INFINITY
    }
  }

  if (rule.type === 'times') {
    return rule.count
  }

  return Number.POSITIVE_INFINITY
}
