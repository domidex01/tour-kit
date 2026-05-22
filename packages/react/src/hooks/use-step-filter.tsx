'use client'

import {
  type AudienceProp,
  type TourStep,
  evaluateAudience as coreEvaluateAudience,
  useSegmentationContext,
  useSegments,
} from '@tour-kit/core'
import * as React from 'react'

/**
 * Pure boolean test: does the current user satisfy this audience? Thin
 * adapter over `@tour-kit/core`'s `evaluateAudience` that pins the caller
 * label so dev warnings name `useStepFilter`. Kept as an exported symbol
 * because the styled `<Tour>` component imports it directly for ad-hoc
 * audience gating outside the step list.
 */
export function evaluateAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>,
  userContext: Record<string, unknown> | undefined
): boolean {
  return coreEvaluateAudience(audience, segments, userContext, 'useStepFilter')
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
