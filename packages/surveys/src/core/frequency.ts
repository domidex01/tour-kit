import type { FrequencyRule, SurveyState } from '../types/survey'

export function canShowByFrequency(
  state: SurveyState,
  rule: FrequencyRule | undefined,
  now: Date = new Date()
): boolean {
  if (state.isSnoozed && state.snoozeUntil && now < state.snoozeUntil) {
    return false
  }

  if (!rule) {
    return true
  }

  if (typeof rule === 'string') {
    switch (rule) {
      case 'once':
        return state.viewCount === 0 && !state.isCompleted
      case 'session':
        return !state.isDismissed && !state.isCompleted
      case 'always':
        return !state.isDismissed
      default:
        return true
    }
  }

  switch (rule.type) {
    case 'times':
      return state.viewCount < rule.count && !state.isCompleted
    case 'interval': {
      if (state.viewCount === 0) return true
      if (!state.lastViewedAt) return true
      const days = daysBetween(state.lastViewedAt, now)
      return days >= rule.days
    }
    default:
      return true
  }
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / msPerDay)
}

export function canShowAfterDismissal(rule: FrequencyRule | undefined): boolean {
  if (!rule) return true
  if (typeof rule === 'string') {
    return rule === 'always'
  }
  return true
}

export function getViewLimit(rule: FrequencyRule | undefined): number {
  if (!rule) return Number.POSITIVE_INFINITY
  if (typeof rule === 'string') {
    return rule === 'once' ? 1 : Number.POSITIVE_INFINITY
  }
  if (rule.type === 'times') return rule.count
  return Number.POSITIVE_INFINITY
}
