'use client'

// NOTE: `isSegmentAudience` and `evaluateHintAudience` mirror
// `evaluateAudience` in `@tour-kit/react/src/hooks/use-step-filter.tsx`.
// Per Phase 3a's plan the helpers are duplicated per-package to avoid
// forcing hints→react. Keep the two files in lockstep when changing
// audience-resolution semantics.

import {
  type AudienceProp,
  matchesAudience,
  useSegmentationContext,
  useSegments,
} from '@tour-kit/core'
import * as React from 'react'
import type { HintConfig } from '../types'

function isSegmentAudience(a: AudienceProp): a is { segment: string } {
  return !Array.isArray(a) && typeof a === 'object' && a !== null && 'segment' in a
}

// Module-scope dedupe set — see the matching comment in
// `@tour-kit/react`'s `use-step-filter.tsx`.
const warnedUnknownSegments = new Set<string>()

export function evaluateHintAudience(
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
        `[tour-kit] useHintFilter: hint references segment "${audience.segment}" not registered in <SegmentationProvider>`
      )
    }
    return segments[audience.segment] === true
  }
  return matchesAudience(audience, userContext)
}

/**
 * Filter a list of hint configs by their `audience` prop. Mirror of
 * `@tour-kit/react`'s `useStepFilter` for `HintConfig[]`. Uses
 * `useSegments()` (bulk read) to satisfy rules-of-hooks under dynamic lists.
 */
export function useHintFilter(hints: HintConfig[]): HintConfig[] {
  const segments = useSegments()
  const { userContext } = useSegmentationContext()
  return React.useMemo(
    () => hints.filter((hint) => evaluateHintAudience(hint.audience, segments, userContext)),
    [hints, segments, userContext]
  )
}
