import { describe, expect, it } from 'vitest'
import { explainAudience } from '../audience'

describe('explainAudience', () => {
  it('returns ok when audience is undefined (everyone matches)', () => {
    const r = explainAudience(undefined, { plan: 'pro' })
    expect(r.ok).toBe(true)
    expect(r.gate).toBe('audience')
  })

  it('returns ok for matching array-form audience', () => {
    const r = explainAudience(
      [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
      { plan: 'pro' }
    )
    expect(r.ok).toBe(true)
  })

  it('returns fail with AUDIENCE_MISMATCH for failing array-form audience', () => {
    const r = explainAudience(
      [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
      { plan: 'free' }
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('AUDIENCE_MISMATCH')
      expect(r.detail?.failingCondition).toMatchObject({
        key: 'plan',
        operator: 'equals',
        value: 'pro',
      })
      expect(r.detail?.userContext).toEqual({ plan: 'free' })
    }
  })

  it('surfaces the FIRST failing condition when multiple conditions exist', () => {
    const conditions = [
      { type: 'user_property' as const, key: 'plan', operator: 'equals' as const, value: 'pro' },
      { type: 'user_property' as const, key: 'role', operator: 'equals' as const, value: 'admin' },
    ]
    const r = explainAudience(conditions, { plan: 'pro', role: 'viewer' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.detail?.failingCondition).toMatchObject({ key: 'role', value: 'admin' })
    }
  })

  it('returns ok for matching segment-form audience', () => {
    const r = explainAudience({ segment: 'admins' }, { segments: ['admins', 'beta'] })
    expect(r.ok).toBe(true)
  })

  it('returns fail with AUDIENCE_MISMATCH for non-matching segment-form audience', () => {
    const r = explainAudience({ segment: 'admins' }, { segments: ['beta'] })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('AUDIENCE_MISMATCH')
      expect(r.detail?.segment).toBe('admins')
    }
  })

  it('returns fail for segment-form audience when userContext lacks segments', () => {
    const r = explainAudience({ segment: 'admins' }, {})
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('AUDIENCE_MISMATCH')
  })
})
