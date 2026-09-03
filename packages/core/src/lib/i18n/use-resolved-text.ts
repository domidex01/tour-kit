'use client'

import type * as React from 'react'
import type { TourNode } from '../../types/primitives'
import { interpolate } from '../interpolate'
import { type LocalizedText, isI18nKey } from '../localized-text'
import { useSegmentationContext } from '../segmentation/segmentation-context'
import { useT } from './use-t'

/**
 * Resolve a `LocalizedText | TourNode` value into a `ReactNode`. Drives the
 * Phase 3a unified text pipeline (promoted to core in Phase 1 of the refactor
 * train — previously duplicated in `@tour-kit/react`, `@tour-kit/hints`, and
 * `@tour-kit/announcements`).
 *
 *   - `string` → `interpolate(value, vars)` (templated literal)
 *   - `{ key }` → `useT()(value.key, vars)` (i18n dictionary)
 *   - any other `TourNode` → returned as-is
 *
 * `vars` defaults to `useSegmentationContext().userContext` so consumers
 * authoring `'Hi {{user.name}}'` get interpolation against the same context
 * driving audience targeting.
 *
 * **Hook, not function** — `useT()` requires React render context. Call from
 * a component body, never from an event handler or `.map()` callback.
 *
 * For string-only outputs (aria-label, title, Dialog.Title) use
 * `useResolveLocalizedText` instead — it returns `string` and skips the
 * ReactNode pass-through branch.
 */
export function useResolvedText(
  value: TourNode | LocalizedText | undefined,
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
