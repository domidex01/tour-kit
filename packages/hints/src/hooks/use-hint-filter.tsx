'use client'

import {
  evaluateAudience as coreEvaluateAudience,
  useSegmentationContext,
  useSegments,
} from '@tour-kit/core'
import * as React from 'react'
import type { HintConfig } from '../types'

/**
 * Filter a list of hint configs by their `audience` prop. Mirror of
 * `@tour-kit/react`'s `useStepFilter` for `HintConfig[]`. Uses
 * `useSegments()` (bulk read) to satisfy rules-of-hooks under dynamic lists.
 */
export function useHintFilter(hints: HintConfig[]): HintConfig[] {
  const segments = useSegments()
  const { userContext } = useSegmentationContext()
  return React.useMemo(
    () =>
      hints.filter((hint) =>
        coreEvaluateAudience(hint.audience, segments, userContext, 'useHintFilter')
      ),
    [hints, segments, userContext]
  )
}
