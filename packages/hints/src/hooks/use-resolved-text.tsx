'use client'

import {
  type LocalizedText,
  interpolate,
  isI18nKey,
  useSegmentationContext,
  useT,
} from '@tour-kit/core'
import type * as React from 'react'

/**
 * Mirror of `@tour-kit/react`'s `useResolvedText`. Per-package duplicate so
 * hints does not need to depend on the react package. Promotion to core is
 * deferred — `useT()` is hook-bound and forcing every UI package to take a
 * runtime core dep on a new helper would widen the public surface this phase.
 */
export function useResolvedText(
  value: React.ReactNode | LocalizedText | undefined,
  vars?: Record<string, unknown>
): React.ReactNode {
  const t = useT()
  const { userContext } = useSegmentationContext()
  const effectiveVars = vars ?? userContext

  if (value === undefined || value === null) return value
  if (typeof value === 'string') return interpolate(value, effectiveVars)
  if (isI18nKey(value)) return t(value.key, effectiveVars)
  return value as React.ReactNode
}
