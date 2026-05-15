import { describe, expect, it } from 'vitest'
import {
  createDevBypassState,
  createUnlicensedState,
  hasLicenseKey,
  normalizeLicenseKey,
} from '../lib/license-state'

describe('normalizeLicenseKey', () => {
  it('trims leading and trailing spaces', () => {
    expect(normalizeLicenseKey('  TOURKIT_key  ')).toBe('TOURKIT_key')
  })

  it('trims tabs and newlines', () => {
    expect(normalizeLicenseKey('\tTOURKIT_key\n')).toBe('TOURKIT_key')
  })

  it('trims non-breaking spaces (\\u00a0)', () => {
    expect(normalizeLicenseKey(' TOURKIT_key ')).toBe('TOURKIT_key')
  })

  it('returns empty string for blank input', () => {
    expect(normalizeLicenseKey('   ')).toBe('')
    expect(normalizeLicenseKey('')).toBe('')
  })

  it('passes through a clean key untouched', () => {
    expect(normalizeLicenseKey('TOURKIT_key')).toBe('TOURKIT_key')
  })

  it('does not collapse internal whitespace', () => {
    expect(normalizeLicenseKey('  TK ABC  ')).toBe('TK ABC')
  })
})

describe('hasLicenseKey', () => {
  it('returns false for empty string', () => {
    expect(hasLicenseKey('')).toBe(false)
  })

  it('returns false for whitespace-only strings', () => {
    expect(hasLicenseKey('   ')).toBe(false)
    expect(hasLicenseKey('\t\n')).toBe(false)
    expect(hasLicenseKey('  ')).toBe(false)
  })

  it('returns true for non-empty key', () => {
    expect(hasLicenseKey('TOURKIT_key')).toBe(true)
  })

  it('returns true for key padded with whitespace', () => {
    expect(hasLicenseKey('  TOURKIT_key  ')).toBe(true)
  })
})

describe('createUnlicensedState', () => {
  it('returns invalid/free shape with the injected timestamp', () => {
    const state = createUnlicensedState(123)
    expect(state).toEqual({
      status: 'invalid',
      tier: 'free',
      activations: 0,
      maxActivations: 0,
      domain: null,
      expiresAt: null,
      validatedAt: 123,
      renderKey: undefined,
    })
  })

  it('defaults validatedAt to Date.now() when not provided', () => {
    const before = Date.now()
    const state = createUnlicensedState()
    const after = Date.now()
    expect(state.validatedAt).toBeGreaterThanOrEqual(before)
    expect(state.validatedAt).toBeLessThanOrEqual(after)
  })

  it('always sets renderKey to undefined (anti-bypass invariant)', () => {
    expect(createUnlicensedState(0).renderKey).toBeUndefined()
  })
})

describe('createDevBypassState', () => {
  it('returns valid/pro shape with renderKey=dev_bypass and the injected timestamp', () => {
    const state = createDevBypassState(456)
    expect(state).toEqual({
      status: 'valid',
      tier: 'pro',
      activations: 0,
      maxActivations: 0,
      domain: null,
      expiresAt: null,
      validatedAt: 456,
      renderKey: 'dev_bypass',
    })
  })

  it('defaults validatedAt to Date.now() when not provided', () => {
    const before = Date.now()
    const state = createDevBypassState()
    const after = Date.now()
    expect(state.validatedAt).toBeGreaterThanOrEqual(before)
    expect(state.validatedAt).toBeLessThanOrEqual(after)
  })
})
