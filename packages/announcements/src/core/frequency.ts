/**
 * Phase 3a lifted these helpers to `@tour-kit/core`. This module keeps the
 * named exports intact so existing imports (`import { canShowByFrequency }
 * from '@tour-kit/announcements'` via the package barrel) keep resolving.
 * Bodies are thin shims that delegate to core — `AnnouncementState` already
 * satisfies `FrequencyState` (`viewCount`, `isDismissed`, `lastViewedAt`).
 *
 * @deprecated Prefer `import { canShowByFrequency } from '@tour-kit/core'` in
 * new code. Re-exports here remain through 1.x.
 */
import {
  type FrequencyRule,
  canShowAfterDismissal as coreCanShowAfterDismissal,
  canShowByFrequency as coreCanShowByFrequency,
  getViewLimit as coreGetViewLimit,
} from '@tour-kit/core'
import type { AnnouncementState } from '../types/announcement'

export function canShowByFrequency(
  state: AnnouncementState,
  rule: FrequencyRule | undefined
): boolean {
  return coreCanShowByFrequency(state, rule)
}

export function canShowAfterDismissal(rule: FrequencyRule | undefined): boolean {
  return coreCanShowAfterDismissal(rule)
}

export function getViewLimit(rule: FrequencyRule | undefined): number {
  return coreGetViewLimit(rule)
}
