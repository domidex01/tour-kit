import type { TourRef } from './primitives'

export type TourTargetRef = TourRef<HTMLElement | null>
export type TourTargetGetter = () => HTMLElement | null

/**
 * Three accepted shapes for `target` on a `TourStep` / `HintConfig`:
 *
 *   - selector string (legacy; runs `document.querySelector` at resolve time)
 *   - `RefObject` (recommended; survives portals, CSS modules, dynamic ids)
 *   - getter function (escape hatch for lazily-mounted DOM)
 *
 * Backwards-compat: string form is documented as fallback only and emits NO
 * dev warning. Existing string selectors continue to resolve through
 * `document.querySelector` unchanged.
 */
export type TourTarget = string | TourTargetRef | TourTargetGetter

/**
 * Resolve a `TourTarget` to a live `HTMLElement` (or `null` when missing).
 *
 * Branch order (closed, non-overlapping):
 *
 *   1. `typeof t === 'string'`                          → `document.querySelector(t)`
 *   2. `t && typeof t === 'object' && 'current' in t`   → `t.current`
 *   3. `typeof t === 'function'`                        → `t()`
 *
 * Strings can't carry `.current`, refs are objects with `.current`, thunks are
 * callables — no branch overlaps with another. Returns `HTMLElement | null`,
 * never `undefined`.
 *
 * SSR-safe: when `document` is not defined (Next.js RSC, Remix server render),
 * the string branch returns `null` without throwing.
 */
export function resolveTarget(t: TourTarget): HTMLElement | null {
  if (typeof t === 'string') {
    if (typeof document === 'undefined') return null
    return document.querySelector<HTMLElement>(t)
  }
  if (t && typeof t === 'object' && 'current' in t) {
    return t.current
  }
  if (typeof t === 'function') {
    return t()
  }
  return null
}
