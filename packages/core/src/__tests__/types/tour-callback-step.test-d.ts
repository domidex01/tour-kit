/**
 * `Tour<TourStep<'a' | 'b'>>.onStepChange` receives a narrowed `TStep` —
 * `step.id` is `'a' | 'b'`, not `string`.
 *
 * Removing any `@ts-expect-error` line MUST break typecheck:types.
 */
import type { Tour, TourStep } from '@tour-kit/core'

type DemoId = 'a' | 'b'

const tour: Tour<TourStep<DemoId>> = {
  id: 'demo',
  steps: [
    { id: 'a', target: '#a', content: 'a' },
    { id: 'b', target: '#b', content: 'b' },
  ],
  onStepChange: (step, _index, _context) => {
    // step.id is narrowed to 'a' | 'b'
    const ok: DemoId = step.id
    void ok

    // @ts-expect-error step.id is 'a' | 'b', not 'c'
    const wrong: 'c' = step.id
    void wrong
  },
}
void tour

// Default-widening path: without a generic arg, step.id stays string.
const wide: Tour = {
  id: 'wide',
  steps: [],
  onStepChange: (step) => {
    const s: string = step.id
    void s
  },
}
void wide
