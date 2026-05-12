import type { Tour, TourStep } from '../types'

/** Literal union of step ids in the shared fixture. */
export type DemoStepId = 'welcome' | 'pricing'

/**
 * Wide-typed two-step tour fixture for runtime suites that don't need the
 * narrowed id type. Used by Phase 1's `use-tour-surface.test.tsx`; re-used
 * by Phase 3/5/6 tests (diagnostic, test-bridge, etc.).
 */
export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}

/**
 * Narrowed-id variant. Constructed directly so TS validates the step ids
 * against `DemoStepId` — a typo in either place breaks the build. Cannot be
 * derived from `twoStepTour` because `Tour<TourStep<DemoStepId>>` is NOT
 * assignable to `Tour<TourStep<string>>` (contravariant `onStepChange`).
 */
export const twoStepTourTyped: Tour<TourStep<DemoStepId>> = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '#a', content: 'a' },
    { id: 'pricing', target: '#b', content: 'b' },
  ],
}

// ─── Phase 3 diagnostic fixtures ────────────────────────────────────────────

export const tourWithSegmentAudience: Tour = {
  id: 'audience-demo',
  steps: [{ id: 's1', target: '#a', content: '' }],
  audience: { segment: 'admins' },
}

export const tourWithConditionAudience: Tour = {
  id: 'cond-demo',
  steps: [{ id: 's1', target: '#a', content: '' }],
  audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
}

export const tourAutoStartFalse: Tour = {
  id: 'no-auto',
  steps: [{ id: 's1', target: '#a', content: '' }],
  autoStart: false,
}

export const tourWithWhenFalse: Tour = {
  id: 'when-false',
  steps: [{ id: 's1', target: '#a', content: '' }],
  when: () => false,
}

export const tourWithWhenThrows: Tour = {
  id: 'when-throws',
  steps: [{ id: 's1', target: '#a', content: '' }],
  when: () => {
    throw new Error('when blew up')
  },
}

export const tourWithWhenAsync: Tour = {
  id: 'when-async',
  steps: [{ id: 's1', target: '#a', content: '' }],
  when: () => Promise.resolve(true),
}
