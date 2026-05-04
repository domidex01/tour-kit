import { describe, expect, it } from 'vitest'
import { isI18nKey } from './localized-text'

describe('isI18nKey', () => {
  it('returns true for { key: string }', () => {
    expect(isI18nKey({ key: 'welcome' })).toBe(true)
    expect(isI18nKey({ key: '' })).toBe(true)
  })

  it('returns true even when other keys are present (covariant on shape)', () => {
    expect(isI18nKey({ key: 'a', extra: 1 })).toBe(true)
  })

  it('returns false for plain strings', () => {
    expect(isI18nKey('plain')).toBe(false)
    expect(isI18nKey('')).toBe(false)
  })

  it('returns false for nullish values', () => {
    expect(isI18nKey(undefined)).toBe(false)
    expect(isI18nKey(null)).toBe(false)
  })

  it('returns false for non-string key types', () => {
    expect(isI18nKey({ key: 42 })).toBe(false)
    expect(isI18nKey({ key: null })).toBe(false)
  })

  it('returns false for objects without a key field', () => {
    expect(isI18nKey({ noKey: 'x' })).toBe(false)
    expect(isI18nKey({})).toBe(false)
  })

  it('returns false for arrays', () => {
    expect(isI18nKey(['key'])).toBe(false)
    expect(isI18nKey([])).toBe(false)
  })

  it('returns false for primitives', () => {
    expect(isI18nKey(42)).toBe(false)
    expect(isI18nKey(true)).toBe(false)
  })
})
