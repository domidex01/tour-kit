'use client'

import { useReducedMotion } from '@tour-kit/core'

/**
 * Hook to detect the user's reduced-motion preference.
 *
 * SSR-safe: delegates to core's {@link useReducedMotion}, which defaults to
 * `true` (assume reduce) on the server and first client render, then flips to
 * the real `matchMedia` value after hydration. Defaulting to "reduce" ensures
 * users who prefer reduced motion never see a frame of animated content before
 * the static fallback resolves.
 *
 * Previously this read `window.matchMedia(...).matches` in a `useState` lazy
 * initializer, which returned `false` on the server but the real value on the
 * client — producing a hydration mismatch for reduced-motion users.
 *
 * @returns Whether the user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion()
}
