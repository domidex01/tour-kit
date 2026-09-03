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
 *   - any other `TourNode` → returned as-is, unchecked (see below)
 *
 * **This is a boundary, and the pass-through is a widening.** `TourNode` is a
 * React-free *supertype* of `ReactNode` (v2 §1.1), so the residue left after
 * the `string` and `{ key }` branches — an element-like, an iterable, a
 * promise, a number/bigint/boolean — is not provably a `ReactNode`. Authoring
 * a `TourNode` React cannot render therefore throws at render time instead of
 * failing `tsc`. That is the accepted cost of a React-free core, and this
 * function plus `<TourCard>`'s `content` prop are the only two places where
 * it is paid; both cast once at the boundary, the convention
 * `lib/schemas/parse.ts` documents.
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
  // Boundary cast — see the widening note in the doc comment above.
  return value as React.ReactNode
}
