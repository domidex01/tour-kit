/**
 * Frequency rules — promoted from `@tour-kit/announcements` in Phase 3a of the
 * UserGuiding parity initiative. Re-exported from `@tour-kit/announcements`
 * with `@deprecated` JSDoc for backward compat.
 */

/**
 * How often a UI surface (announcement, hint, tour) can be shown.
 *
 *   - `'once'`     — show only when never viewed
 *   - `'session'`  — show until dismissed in the current session
 *   - `'always'`   — show every time conditions are met
 *   - `{ type: 'times', count }`     — show up to `count` times total
 *   - `{ type: 'interval', days }`   — re-show after `days` days have passed
 */
export type FrequencyRule =
  | 'once'
  | 'session'
  | 'always'
  | { type: 'times'; count: number }
  | { type: 'interval'; days: number }

/**
 * Minimal state shape needed by the frequency helpers. Both
 * `AnnouncementState` (announcements) and the per-hint frequency slice
 * satisfy this — keep this interface narrow so new consumers (tours, etc.)
 * do not have to invent new state fields.
 */
export interface FrequencyState {
  viewCount: number
  isDismissed: boolean
  lastViewedAt: Date | null
}

/**
 * Decide whether a surface can be shown right now given its persisted state
 * and the configured rule. `undefined` rule defaults to "always show".
 */
export function canShowByFrequency(
  state: FrequencyState,
  rule: FrequencyRule | undefined
): boolean {
  if (!rule) {
    return true
  }

  if (typeof rule === 'string') {
    switch (rule) {
      case 'once':
        return state.viewCount === 0
      case 'session':
      case 'always':
        return !state.isDismissed
      default:
        return true
    }
  }

  switch (rule.type) {
    case 'times':
      return state.viewCount < rule.count
    case 'interval': {
      if (state.viewCount === 0) return true
      if (!state.lastViewedAt) return true
      const days = daysBetween(state.lastViewedAt, new Date())
      return days >= rule.days
    }
    default:
      return true
  }
}

/**
 * Whether dismissal is permanent for the rule. `'once'` and `'session'`
 * suppress further shows after dismissal; `'always'` and the object rules
 * permit re-showing.
 */
export function canShowAfterDismissal(rule: FrequencyRule | undefined): boolean {
  if (!rule) return true
  if (typeof rule === 'string') {
    return rule !== 'once' && rule !== 'session'
  }
  return true
}

/**
 * Hard cap on lifetime views for the rule. `'once'` → 1; everything else is
 * effectively unbounded except `{ type: 'times', count }` which returns `count`.
 */
export function getViewLimit(rule: FrequencyRule | undefined): number {
  if (!rule) return Number.POSITIVE_INFINITY
  if (typeof rule === 'string') {
    return rule === 'once' ? 1 : Number.POSITIVE_INFINITY
  }
  if (rule.type === 'times') return rule.count
  return Number.POSITIVE_INFINITY
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / msPerDay)
}
