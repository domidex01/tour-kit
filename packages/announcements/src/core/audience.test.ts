import {
  type AudienceCondition as CoreCond,
  matchesAudience as CoreMatch,
  validateConditions as CoreValidate,
} from '@tour-kit/core'
import { describe, expect, it } from 'vitest'
import { matchesAudience as AnnMatch, validateConditions as AnnValidate } from './audience'

describe('audience re-export contract (Phase 1 promotion)', () => {
  it('matchesAudience is the same function instance from core', () => {
    expect(AnnMatch).toBe(CoreMatch)
  })

  it('validateConditions is the same function instance from core', () => {
    expect(AnnValidate).toBe(CoreValidate)
  })

  it('AudienceCondition type from announcements is assignable to the core type', () => {
    const cond: CoreCond = {
      type: 'user_property',
      key: 'plan',
      operator: 'equals',
      value: 'pro',
    }
    expect(AnnMatch([cond], { plan: 'pro' })).toBe(true)
  })

  it('still resolves a smoke condition through the announcements re-export', () => {
    expect(
      AnnMatch(
        [{ type: 'user_property', key: 'role', operator: 'in', value: ['admin', 'editor'] }],
        { role: 'editor' }
      )
    ).toBe(true)
  })
})
