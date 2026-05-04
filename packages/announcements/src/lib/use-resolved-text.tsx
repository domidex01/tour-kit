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
 * Mirror of `@tour-kit/hints` and `@tour-kit/react`'s `useResolvedText`.
 * Per-package duplicate so announcements does not require a runtime dep on
 * either sibling. Keep the three implementations in lockstep when changing
 * resolution semantics.
 *
 *   string         → `interpolate(value, vars)`
 *   { key: '…' }   → `useT()(value.key, vars)`
 *   ReactNode      → returned unchanged
 *
 * `vars` defaults to `useSegmentationContext().userContext` so consumers who
 * pass `userContext` to `<SegmentationProvider>` get interpolation against the
 * same data with no extra plumbing.
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
