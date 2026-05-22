import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uniqueSegment } from '../__tests__/_helpers/unique-segment'
import type { AudienceCondition } from '../types/audience'
import type { AudienceProp } from '../types/step'
import { logger } from '../utils/logger'
import {
  evaluateAudience,
  isSegmentAudience,
  matchesAudience,
  validateConditions,
} from './audience'

const cond = (
  operator: AudienceCondition['operator'],
  key: string,
  value?: unknown
): AudienceCondition => ({ type: 'user_property', key, operator, value })

describe('matchesAudience', () => {
  describe('short-circuits', () => {
    it('returns true when conditions are undefined (everyone matches)', () => {
      expect(matchesAudience(undefined, { plan: 'pro' })).toBe(true)
    })

    it('returns true when conditions array is empty', () => {
      expect(matchesAudience([], { plan: 'pro' })).toBe(true)
    })

    it('returns false when userContext is missing and condition is not not_exists', () => {
      expect(matchesAudience([cond('equals', 'plan', 'pro')], undefined)).toBe(false)
    })

    it('returns true when userContext is missing and condition is not_exists', () => {
      expect(matchesAudience([cond('not_exists', 'plan')], undefined)).toBe(true)
    })
  })

  describe('operators', () => {
    it('equals: matches when context value === expected value', () => {
      expect(matchesAudience([cond('equals', 'plan', 'pro')], { plan: 'pro' })).toBe(true)
      expect(matchesAudience([cond('equals', 'plan', 'pro')], { plan: 'free' })).toBe(false)
    })

    it('not_equals: matches when context value !== expected value', () => {
      expect(matchesAudience([cond('not_equals', 'plan', 'pro')], { plan: 'free' })).toBe(true)
      expect(matchesAudience([cond('not_equals', 'plan', 'pro')], { plan: 'pro' })).toBe(false)
    })

    it('contains: matches substrings on string contextValue', () => {
      expect(matchesAudience([cond('contains', 'name', 'om')], { name: 'Domi' })).toBe(true)
      expect(matchesAudience([cond('contains', 'name', 'xx')], { name: 'Domi' })).toBe(false)
    })

    it('contains: matches array membership when contextValue is an array', () => {
      expect(matchesAudience([cond('contains', 'tags', 'beta')], { tags: ['beta', 'admin'] })).toBe(
        true
      )
      expect(
        matchesAudience([cond('contains', 'tags', 'gamma')], { tags: ['beta', 'admin'] })
      ).toBe(false)
    })

    it('contains: returns false when contextValue type is unsupported', () => {
      expect(matchesAudience([cond('contains', 'n', 'x')], { n: 42 })).toBe(false)
    })

    it('not_contains: inverse of contains for strings and arrays', () => {
      expect(matchesAudience([cond('not_contains', 'name', 'xx')], { name: 'Domi' })).toBe(true)
      expect(matchesAudience([cond('not_contains', 'name', 'om')], { name: 'Domi' })).toBe(false)
      expect(
        matchesAudience([cond('not_contains', 'tags', 'gamma')], { tags: ['beta', 'admin'] })
      ).toBe(true)
    })

    it('not_contains: returns true when contextValue type is unsupported', () => {
      expect(matchesAudience([cond('not_contains', 'n', 'x')], { n: 42 })).toBe(true)
    })

    it('in: matches when contextValue is in the value array', () => {
      expect(matchesAudience([cond('in', 'plan', ['pro', 'enterprise'])], { plan: 'pro' })).toBe(
        true
      )
      expect(matchesAudience([cond('in', 'plan', ['pro', 'enterprise'])], { plan: 'free' })).toBe(
        false
      )
    })

    it('in: returns false when expected value is not an array', () => {
      expect(matchesAudience([cond('in', 'plan', 'pro')], { plan: 'pro' })).toBe(false)
    })

    it('not_in: matches when contextValue is NOT in the value array', () => {
      expect(matchesAudience([cond('not_in', 'plan', ['free'])], { plan: 'pro' })).toBe(true)
      expect(matchesAudience([cond('not_in', 'plan', ['free', 'pro'])], { plan: 'pro' })).toBe(
        false
      )
    })

    it('not_in: returns true when expected value is not an array', () => {
      expect(matchesAudience([cond('not_in', 'plan', 'pro')], { plan: 'pro' })).toBe(true)
    })

    it('exists: matches when contextValue is defined and non-null', () => {
      expect(matchesAudience([cond('exists', 'plan')], { plan: 'pro' })).toBe(true)
      expect(matchesAudience([cond('exists', 'plan')], { plan: null })).toBe(false)
      expect(matchesAudience([cond('exists', 'plan')], {})).toBe(false)
    })

    it('not_exists: matches when contextValue is undefined or null', () => {
      expect(matchesAudience([cond('not_exists', 'plan')], {})).toBe(true)
      expect(matchesAudience([cond('not_exists', 'plan')], { plan: null })).toBe(true)
      expect(matchesAudience([cond('not_exists', 'plan')], { plan: 'pro' })).toBe(false)
    })
  })

  describe('nested key resolution', () => {
    it('resolves dot-path keys against nested context', () => {
      expect(
        matchesAudience([cond('equals', 'user.role', 'admin')], { user: { role: 'admin' } })
      ).toBe(true)
    })

    it('returns false when nested path resolves through a primitive', () => {
      expect(matchesAudience([cond('equals', 'user.role', 'admin')], { user: 'admin' })).toBe(false)
    })

    it('returns false when intermediate key is missing', () => {
      expect(matchesAudience([cond('equals', 'user.role', 'admin')], {})).toBe(false)
    })
  })

  describe('AND semantics across multiple conditions', () => {
    it('returns true only when every condition matches', () => {
      const conditions = [cond('equals', 'plan', 'pro'), cond('exists', 'email')]
      expect(matchesAudience(conditions, { plan: 'pro', email: 'x@y.z' })).toBe(true)
      expect(matchesAudience(conditions, { plan: 'pro' })).toBe(false)
    })
  })
})

describe('validateConditions', () => {
  it('returns no errors for a well-formed condition set', () => {
    expect(
      validateConditions([
        cond('equals', 'plan', 'pro'),
        cond('in', 'role', ['admin', 'editor']),
        cond('exists', 'email'),
      ])
    ).toEqual([])
  })

  it('flags missing key', () => {
    const errors = validateConditions([cond('equals', '', 'pro')])
    expect(errors).toContain('Condition key is required')
  })

  it('flags missing operator', () => {
    // Force a malformed condition (TS would block this, but runtime validation matters)
    const malformed = {
      type: 'user_property',
      key: 'plan',
      value: 'pro',
    } as unknown as AudienceCondition
    const errors = validateConditions([malformed])
    expect(errors).toContain('Condition operator is required')
  })

  it('flags missing value for operators that need one', () => {
    const errors = validateConditions([
      { type: 'user_property', key: 'plan', operator: 'equals' } as AudienceCondition,
    ])
    expect(errors.some((e: string) => e.includes("Value is required for operator 'equals'"))).toBe(
      true
    )
  })

  it('does NOT flag missing value for exists / not_exists', () => {
    const errors = validateConditions([cond('exists', 'plan'), cond('not_exists', 'churned_at')])
    expect(errors).toEqual([])
  })

  it('flags non-array value for in / not_in', () => {
    const errors = validateConditions([cond('in', 'plan', 'pro'), cond('not_in', 'role', 'admin')])
    expect(errors).toContain("Value must be an array for operator 'in'")
    expect(errors).toContain("Value must be an array for operator 'not_in'")
  })
})

describe('isSegmentAudience', () => {
  it('narrows segment-shape object to true', () => {
    const audience: AudienceProp = { segment: 'admins' }
    expect(isSegmentAudience(audience)).toBe(true)
  })

  it('returns false for array audiences', () => {
    const arr: AudienceProp = [cond('equals', 'plan', 'pro')]
    expect(isSegmentAudience(arr)).toBe(false)
  })

  // `AudienceProp` excludes `undefined`, but the helper runs inside callers
  // that may receive runtime-narrowed values, so we still cover the path.
  it('returns false for null-ish runtime values', () => {
    expect(isSegmentAudience(null as unknown as AudienceProp)).toBe(false)
    expect(isSegmentAudience(undefined as unknown as AudienceProp)).toBe(false)
  })
})

describe('evaluateAudience', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  describe('short-circuits', () => {
    it('returns true for undefined audience', () => {
      expect(evaluateAudience(undefined, {}, undefined, 'useStepFilter')).toBe(true)
    })
  })

  describe('segment branch', () => {
    it('passes when segment is registered true', () => {
      expect(
        evaluateAudience({ segment: 'beta' }, { beta: true }, undefined, 'useStepFilter')
      ).toBe(true)
    })

    it('filters when segment is registered false', () => {
      expect(
        evaluateAudience({ segment: 'beta' }, { beta: false }, undefined, 'useStepFilter')
      ).toBe(false)
    })

    it('warns once per unknown segment naming the caller', () => {
      const seg = uniqueSegment('beta')
      evaluateAudience({ segment: seg }, {}, undefined, 'useStepFilter')
      evaluateAudience({ segment: seg }, {}, undefined, 'useStepFilter')
      evaluateAudience({ segment: seg }, {}, undefined, 'useStepFilter')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/useStepFilter/)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(new RegExp(seg))
    })

    it('warns again for a different unknown segment', () => {
      const a = uniqueSegment('beta-a')
      const b = uniqueSegment('beta-b')
      evaluateAudience({ segment: a }, {}, undefined, 'useStepFilter')
      evaluateAudience({ segment: b }, {}, undefined, 'useStepFilter')
      expect(warnSpy).toHaveBeenCalledTimes(2)
    })

    it('does NOT warn when segment is registered (even if false)', () => {
      const seg = uniqueSegment('known')
      evaluateAudience({ segment: seg }, { [seg]: false }, undefined, 'useStepFilter')
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('passes through the caller string into the warning', () => {
      const seg = uniqueSegment('unk')
      evaluateAudience({ segment: seg }, {}, undefined, 'useHintFilter')
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/useHintFilter/)
    })
  })

  describe('array branch — delegates to matchesAudience', () => {
    it('returns true when conditions match userContext', () => {
      const audience: AudienceProp = [cond('equals', 'plan', 'pro')]
      expect(evaluateAudience(audience, {}, { plan: 'pro' }, 'useStepFilter')).toBe(true)
    })

    it('returns false when conditions miss userContext', () => {
      const audience: AudienceProp = [cond('equals', 'plan', 'pro')]
      expect(evaluateAudience(audience, {}, { plan: 'free' }, 'useStepFilter')).toBe(false)
    })

    it('returns false when userContext is missing and operator is not not_exists', () => {
      const audience: AudienceProp = [cond('equals', 'plan', 'pro')]
      expect(evaluateAudience(audience, {}, undefined, 'useStepFilter')).toBe(false)
    })
  })
})
