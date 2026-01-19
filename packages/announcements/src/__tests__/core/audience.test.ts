import { describe, expect, it } from 'vitest'
import { matchesAudience, validateConditions } from '../../core/audience'
import type { AudienceCondition } from '../../types/announcement'

describe('matchesAudience', () => {
  describe('no conditions', () => {
    it('matches when no conditions', () => {
      expect(matchesAudience(undefined, {})).toBe(true)
      expect(matchesAudience([], {})).toBe(true)
    })
  })

  describe('equals operator', () => {
    it('matches when value equals', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
      ]
      expect(matchesAudience(conditions, { plan: 'pro' })).toBe(true)
    })

    it('does not match when value differs', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
      ]
      expect(matchesAudience(conditions, { plan: 'free' })).toBe(false)
    })
  })

  describe('not_equals operator', () => {
    it('matches when value differs', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'not_equals', value: 'free' },
      ]
      expect(matchesAudience(conditions, { plan: 'pro' })).toBe(true)
    })

    it('does not match when value equals', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'not_equals', value: 'free' },
      ]
      expect(matchesAudience(conditions, { plan: 'free' })).toBe(false)
    })
  })

  describe('contains operator', () => {
    it('matches when string contains value', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'email', operator: 'contains', value: '@company.com' },
      ]
      expect(matchesAudience(conditions, { email: 'user@company.com' })).toBe(true)
    })

    it('matches when array contains value', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'roles', operator: 'contains', value: 'admin' },
      ]
      expect(matchesAudience(conditions, { roles: ['user', 'admin'] })).toBe(true)
    })

    it('does not match when not contained', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'email', operator: 'contains', value: '@company.com' },
      ]
      expect(matchesAudience(conditions, { email: 'user@other.com' })).toBe(false)
    })
  })

  describe('in operator', () => {
    it('matches when value is in array', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'country', operator: 'in', value: ['US', 'CA', 'UK'] },
      ]
      expect(matchesAudience(conditions, { country: 'US' })).toBe(true)
    })

    it('does not match when value not in array', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'country', operator: 'in', value: ['US', 'CA', 'UK'] },
      ]
      expect(matchesAudience(conditions, { country: 'DE' })).toBe(false)
    })
  })

  describe('exists operator', () => {
    it('matches when property exists', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'email', operator: 'exists' },
      ]
      expect(matchesAudience(conditions, { email: 'user@test.com' })).toBe(true)
    })

    it('does not match when property is null', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'email', operator: 'exists' },
      ]
      expect(matchesAudience(conditions, { email: null })).toBe(false)
    })

    it('does not match when property is undefined', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'email', operator: 'exists' },
      ]
      expect(matchesAudience(conditions, {})).toBe(false)
    })
  })

  describe('not_exists operator', () => {
    it('matches when property does not exist', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'deletedAt', operator: 'not_exists' },
      ]
      expect(matchesAudience(conditions, {})).toBe(true)
    })

    it('does not match when property exists', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'deletedAt', operator: 'not_exists' },
      ]
      expect(matchesAudience(conditions, { deletedAt: new Date() })).toBe(false)
    })
  })

  describe('nested properties', () => {
    it('accesses nested properties with dot notation', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'subscription.plan', operator: 'equals', value: 'pro' },
      ]
      expect(matchesAudience(conditions, { subscription: { plan: 'pro' } })).toBe(true)
    })

    it('handles missing nested properties', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'subscription.plan', operator: 'equals', value: 'pro' },
      ]
      expect(matchesAudience(conditions, {})).toBe(false)
    })
  })

  describe('multiple conditions (AND)', () => {
    it('matches when all conditions match', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
        { type: 'user_property', key: 'verified', operator: 'equals', value: true },
      ]
      expect(matchesAudience(conditions, { plan: 'pro', verified: true })).toBe(true)
    })

    it('does not match when any condition fails', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
        { type: 'user_property', key: 'verified', operator: 'equals', value: true },
      ]
      expect(matchesAudience(conditions, { plan: 'pro', verified: false })).toBe(false)
    })
  })

  describe('no user context', () => {
    it('fails most conditions without context', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
      ]
      expect(matchesAudience(conditions, undefined)).toBe(false)
    })

    it('passes not_exists without context', () => {
      const conditions: AudienceCondition[] = [
        { type: 'user_property', key: 'deletedAt', operator: 'not_exists' },
      ]
      expect(matchesAudience(conditions, undefined)).toBe(true)
    })
  })
})

describe('validateConditions', () => {
  it('returns no errors for valid conditions', () => {
    const conditions: AudienceCondition[] = [
      { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
    ]
    expect(validateConditions(conditions)).toEqual([])
  })

  it('returns error for missing key', () => {
    const conditions = [
      { type: 'user_property', key: '', operator: 'equals', value: 'pro' },
    ] as AudienceCondition[]
    expect(validateConditions(conditions)).toContain('Condition key is required')
  })

  it('returns error for in operator without array', () => {
    const conditions = [
      { type: 'user_property', key: 'plan', operator: 'in', value: 'pro' },
    ] as AudienceCondition[]
    expect(validateConditions(conditions)).toContain("Value must be an array for operator 'in'")
  })
})
