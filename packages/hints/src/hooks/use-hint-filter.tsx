'use client'

import {
  evaluateAudience as coreEvaluateAudience,
  type AudienceProp,
  useSegmentationContext,
  useSegments,
} from '@tour-kit/core'
import * as React from 'react'
import type { HintConfig } from '../types'

/**
 * Pure boolean test for a hint's `audience`. Thin adapter over
 * `@tour-kit/core`'s `evaluateAudience` that pins the caller label so dev
 * warnings name `useHintFilter`. Kept as an exported symbol because existing
 * consumers may import it directly.
 */
export function evaluateHintAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>,
  userContext: Record<string, unknown> | undefined
): boolean {
  return coreEvaluateAudience(audience, segments, userContext, 'useHintFilter')
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
