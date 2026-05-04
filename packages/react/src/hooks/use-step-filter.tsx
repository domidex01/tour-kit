'use client'

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
    if (!(audience.segment in segments) && process.env.NODE_ENV !== 'production') {
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
