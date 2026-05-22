'use client'

import { evaluateAudience as coreEvaluateAudience, useSegments } from '@tour-kit/core'
import * as React from 'react'
import type { AnnouncementConfig, AudienceProp } from '../types/announcement'

/**
 * Resolve a single announcement's audience for the segment-shape branch only.
 *
 * Returns `true` (let through) for `undefined` and array-shape audiences —
 * the array branch is re-checked downstream by the scheduler against the
 * `<AnnouncementsProvider userContext>` prop, which is the legacy contract
 * we must preserve. Only segment-shape audiences are filtered here, because
 * those require `<SegmentationProvider>` and can't be evaluated in the
 * scheduler (which is framework-agnostic).
 *
 * **Why this wraps `core.evaluateAudience` instead of using it directly:**
 * the core helper evaluates array audiences via `matchesAudience` — that
 * would require a `userContext` we don't have at this seam. Short-circuit
 * the array branch before delegating so the scheduler stays the single
 * authority on `userContext`-driven matching.
 */
export function evaluateAnnouncementAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>
): boolean {
  if (!audience) return true
  // Array-shape audiences are forwarded to the scheduler unchanged — it owns
  // the legacy `matchesAudience(audience, userContext)` evaluation against the
  // provider's `userContext` prop. (See memory #204 / phase-1 Open Question 1.)
  if (Array.isArray(audience)) return true
  // After the two guards above, `AudienceProp = AudienceCondition[] | { segment: string }`
  // narrows to the segment branch — delegate to core for warn-once + segment lookup.
  // `userContext` is intentionally `undefined`; arrays never reach here.
  return coreEvaluateAudience(audience, segments, undefined, 'useFilteredAnnouncements')
}

/**
 * Filter a list of announcement configs by their `audience` prop. Mirror of
 * `@tour-kit/hints`'s `useHintFilter` for `AnnouncementConfig[]`. Uses
 * `useSegments()` (bulk read) once at the top of the provider to satisfy
 * rules-of-hooks under dynamic announcement lists — never call `useSegment`
 * inside `.filter`. Only the segment-shape audience branch is filtered here;
 * array-shape audiences pass through to the scheduler for backward compat.
 */
export function useFilteredAnnouncements(
  announcements: AnnouncementConfig[]
): AnnouncementConfig[] {
  const segments = useSegments()
  return React.useMemo(
    () => announcements.filter((a) => evaluateAnnouncementAudience(a.audience, segments)),
    [announcements, segments]
  )
}
