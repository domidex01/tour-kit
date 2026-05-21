import type { AudienceCondition as CoreCondition } from '@tour-kit/core'
import { describe, expectTypeOf, it } from 'vitest'
import type { AudienceCondition as SurveysCondition } from '../types/survey'

describe('AudienceCondition type alias (Phase 1 hoist)', () => {
  it('surveys AudienceCondition is type-equal to @tour-kit/core AudienceCondition', () => {
    // Re-export equivalence: surveys is now a type alias, not a separate
    // interface, so structural and nominal identity must hold.
    expectTypeOf<SurveysCondition>().toEqualTypeOf<CoreCondition>()
  })
})
