'use client'

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

export function evaluateHintAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>,
  userContext: Record<string, unknown> | undefined
): boolean {
  if (!audience) return true
  if (isSegmentAudience(audience)) {
    if (!(audience.segment in segments) && process.env.NODE_ENV !== 'production') {
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
