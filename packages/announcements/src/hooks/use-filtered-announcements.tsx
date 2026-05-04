'use client'

// NOTE: `evaluateAnnouncementAudience` mirrors `evaluateHintAudience` in
// `@tour-kit/hints/src/hooks/use-hint-filter.tsx` and `evaluateAudience` in
// `@tour-kit/react/src/hooks/use-step-filter.tsx`. Per Phase 3a's plan the
// helpers are duplicated per-package to avoid forcing a runtime dep across
// sibling UI packages. Keep all three in lockstep when changing
// audience-resolution semantics.

import { useSegments } from '@tour-kit/core'
import * as React from 'react'
import {
  type AnnouncementConfig,
  type AudienceProp,
  isSegmentAudience,
} from '../types/announcement'

// Module-scope dedupe set — see the matching comment in
// `@tour-kit/hints`'s `use-hint-filter.tsx`. Without this a misconfigured
// segment reference would log on every render.
const warnedUnknownSegments = new Set<string>()

/**
 * Resolve a single announcement's audience for the segment-shape branch only.
 *
 * Returns `true` (let through) for `undefined` and array-shape audiences —
 * the array branch is re-checked downstream by the scheduler against the
 * `<AnnouncementsProvider userContext>` prop, which is the legacy contract
 * we must preserve. Only segment-shape audiences are filtered here, because
 * those require `<SegmentationProvider>` and can't be evaluated in the
 * scheduler (which is framework-agnostic).
 */
export function evaluateAnnouncementAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>
): boolean {
  if (!audience) return true
  if (isSegmentAudience(audience)) {
    if (
      !(audience.segment in segments) &&
      process.env.NODE_ENV !== 'production' &&
      !warnedUnknownSegments.has(audience.segment)
    ) {
      warnedUnknownSegments.add(audience.segment)
      console.warn(
        `[tour-kit] useFilteredAnnouncements: announcement references segment "${audience.segment}" not registered in <SegmentationProvider>`
      )
    }
    return segments[audience.segment] === true
  }
  // Array-shape audiences are forwarded to the scheduler unchanged — it owns
  // the legacy `matchesAudience(audience, userContext)` evaluation against the
  // provider's `userContext` prop.
  return true
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
