// Phase 3 (refactor train) — `TourStep` is a discriminated union; downstream
// consumers can `Extract<TourStep, { kind: 'hidden' }>` and narrow without
// re-deriving the union locally.

import { expectTypeOf } from 'vitest'
import type { HiddenTourStep, TourStep, VisibleTourStep } from '../../types/step'

// `TourStep` equals `VisibleTourStep | HiddenTourStep`.
expectTypeOf<TourStep>().toEqualTypeOf<VisibleTourStep | HiddenTourStep>()

// `Extract` over the discriminator narrows to exactly one branch.
expectTypeOf<Extract<TourStep, { kind: 'hidden' }>>().toEqualTypeOf<HiddenTourStep>()

// `Exclude` over the discriminator gives the complementary branch.
// Note: VisibleTourStep has `kind?: 'visible'` so excluding 'hidden' yields
// the visible branch.
expectTypeOf<Exclude<TourStep, { kind: 'hidden' }>>().toEqualTypeOf<VisibleTourStep>()

// Generic step ids flow through both branches.
type IdsUnion = TourStep<'welcome' | 'pricing'>['id']
expectTypeOf<IdsUnion>().toEqualTypeOf<'welcome' | 'pricing'>()
