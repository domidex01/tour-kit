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
 * Resolve a `LocalizedText | ReactNode` value into a `ReactNode`. Drives the
 * Phase 3a unified text pipeline:
 *
 *   - `string` → `interpolate(value, vars)` (templated literal)
 *   - `{ key }` → `useT()(value.key, vars)` (i18n dictionary)
 *   - any other `ReactNode` → returned as-is
 *
 * `vars` defaults to `useSegmentationContext().userContext` so consumers
 * authoring `'Hi {{user.name}}'` get interpolation against the same context
 * driving audience targeting.
 *
 * **Hook, not function** — `useT()` requires React render context. Call from
 * a component body, never from an event handler or `.map()` callback.
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
