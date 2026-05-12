import type { Tour, TourStep } from '../types'

/**
 * Shared two-step tour fixture for runtime suites that need a known tour
 * shape. Used by Phase 1's `use-tour-surface.test.tsx` and will be re-used by
 * Phase 3/5/6 tests (diagnostic, test-bridge, etc.) — keeping it here avoids
 * duplicating the same trivial tour across files.
 */
export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}

/** Literal union of `twoStepTour` step ids — used by type tests. */
export type DemoStepId = 'welcome' | 'pricing'

/**
 * Narrowed-id variant of `twoStepTour`. Casts through the same runtime object
 * because the data is identical — only the static type differs.
 */
export const twoStepTourTyped: Tour<TourStep<DemoStepId>> = twoStepTour as Tour<
  TourStep<DemoStepId>
>
