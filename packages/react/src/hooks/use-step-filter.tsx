'use client'

// NOTE: `isSegmentAudience` and `evaluateAudience` are mirrored in
// `@tour-kit/hints/src/hooks/use-hint-filter.tsx`. Per Phase 3a's plan the
// helpers are duplicated per-package to avoid forcing hints to depend on
// react; promotion to core is deferred. Keep the two files in lockstep
// when changing audience-resolution semantics.

import {
  type AudienceProp,
  type TourStep,
  matchesAudience,
  useSegmentationContext,
  useSegments,
} from '@tour-kit/core'
import * as React from 'react'

function isSegmentAudience(a: AudienceProp): a is { segment: string } {
  return !Array.isArray(a) && typeof a === 'object' && a !== null && 'segment' in a
}

// De-dupe dev warnings: `evaluateAudience` runs inside `Array.filter` inside
// a `useMemo`. Without this set, an unknown segment referenced by N steps
// would emit N warnings on every memo recompute (e.g. on every userContext
// change). Module-scope is fine — names are app-wide stable.
const warnedUnknownSegments = new Set<string>()

/**
 * Pure boolean test: does the current user satisfy this audience? Reused by
 * `useStepFilter` and `useTour` audience gating so the dispatch between the
 * legacy array shape and the segment-named object shape stays in lockstep.
 */
export function evaluateAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>,
  userContext: Record<string, unknown> | undefined
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
        `[tour-kit] useStepFilter: step references segment "${audience.segment}" not registered in <SegmentationProvider>`
      )
    }
    return segments[audience.segment] === true
  }
  return matchesAudience(audience, userContext)
}

/**
 * Filter a step list by per-step `audience`. Keeps steps without `audience`
 * unconditionally; for steps with `audience` runs through `useSegments`
 * (segment branch) or `matchesAudience` (legacy array branch).
 *
 * **Critical:** uses `useSegments()` (single bulk read), NOT `useSegment` in
 * a `.map`. Per-segment hooks inside iteration violate rules-of-hooks if the
 * step list changes identity across renders.
 */
export function useStepFilter(steps: TourStep[]): TourStep[] {
  const segments = useSegments()
  const { userContext } = useSegmentationContext()
  return React.useMemo(
    () => steps.filter((step) => evaluateAudience(step.audience, segments, userContext)),
    [steps, segments, userContext]
  )
}
