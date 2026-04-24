import { describe, expect, it } from 'vitest'
import { matchesAudience } from '../core/audience'
import type { AudienceCondition } from '../types/survey'

describe('matchesAudience', () => {
  it('returns true with no conditions', () => {
    expect(matchesAudience(undefined, {})).toBe(true)
    expect(matchesAudience([], {})).toBe(true)
  })

  it('only not_exists passes with no userContext', () => {
    const conds: AudienceCondition[] = [
      { type: 'user_property', key: 'missing', operator: 'not_exists' },
    ]
    expect(matchesAudience(conds, undefined)).toBe(true)
    expect(
      matchesAudience(
        [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
        undefined
      )
    ).toBe(false)
  })

  it('equals/not_equals', () => {
    const ctx = { plan: 'pro' }
    expect(
      matchesAudience(
        [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
        ctx
      )
    ).toBe(true)
    expect(
      matchesAudience(
        [{ type: 'user_property', key: 'plan', operator: 'not_equals', value: 'free' }],
        ctx
      )
    ).toBe(true)
  })

  it('contains for strings and arrays', () => {
    expect(
      matchesAudience(
        [{ type: 'user_property', key: 'name', operator: 'contains', value: 'Ali' }],
        { name: 'Alice' }
      )
    ).toBe(true)
    expect(
      matchesAudience(
        [{ type: 'feature_flag', key: 'flags', operator: 'contains', value: 'beta' }],
        { flags: ['alpha', 'beta'] }
      )
    ).toBe(true)
  })

  it('in / not_in', () => {
    expect(
      matchesAudience([{ type: 'segment', key: 'segment', operator: 'in', value: ['a', 'b'] }], {
        segment: 'a',
      })
    ).toBe(true)
    expect(
      matchesAudience(
        [{ type: 'segment', key: 'segment', operator: 'not_in', value: ['a', 'b'] }],
        { segment: 'c' }
      )
    ).toBe(true)
  })

  it('exists / not_exists', () => {
    expect(
      matchesAudience([{ type: 'user_property', key: 'plan', operator: 'exists' }], { plan: 'pro' })
    ).toBe(true)
    expect(
      matchesAudience([{ type: 'user_property', key: 'plan', operator: 'not_exists' }], {})
    ).toBe(true)
  })

  it('supports nested key with dot notation', () => {
    expect(
      matchesAudience(
        [{ type: 'user_property', key: 'user.plan', operator: 'equals', value: 'pro' }],
        { user: { plan: 'pro' } }
      )
    ).toBe(true)
  })

  it('all conditions must match (AND)', () => {
    expect(
      matchesAudience(
        [
          { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
          { type: 'segment', key: 'country', operator: 'equals', value: 'US' },
        ],
        { plan: 'pro', country: 'US' }
      )
    ).toBe(true)
    expect(
      matchesAudience(
        [
          { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
          { type: 'segment', key: 'country', operator: 'equals', value: 'US' },
        ],
        { plan: 'pro', country: 'CA' }
      )
    ).toBe(false)
  })
})
