import { describe, expect, it } from 'vitest'
import { getCurrentDomain, validateDomain, validateLicense } from '../utils/validate'

describe('validateLicense', () => {
  it('returns invalid for undefined license key', async () => {
    const result = await validateLicense(undefined)
    expect(result.valid).toBe(false)
    expect(result.payload).toBeNull()
    expect(result.error).toBeNull()
  })

  it('returns invalid for empty license key', async () => {
    const result = await validateLicense('')
    expect(result.valid).toBe(false)
  })

  it('returns invalid_format for license without tk_ prefix', async () => {
    const result = await validateLicense('invalid_key')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('invalid_format')
  })

  it('returns parse_error for invalid JWT', async () => {
    const result = await validateLicense('tk_invalid_jwt_token')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('parse_error')
  })
})

describe('validateDomain', () => {
  it('returns true when no domain limits set', () => {
    const payload = {
      sub: 'customer-1',
      iss: 'tourkit.dev',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 86400,
      email: 'test@example.com',
      tier: 'pro' as const,
      packages: [],
      features: [],
    }
    expect(validateDomain(payload, 'example.com')).toBe(true)
  })

  it('returns true for exact domain match', () => {
    const payload = {
      sub: 'customer-1',
      iss: 'tourkit.dev',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 86400,
      email: 'test@example.com',
      tier: 'pro' as const,
      packages: [],
      features: [],
      limits: { maxDomains: ['example.com'] },
    }
    expect(validateDomain(payload, 'example.com')).toBe(true)
  })

  it('returns false for non-matching domain', () => {
    const payload = {
      sub: 'customer-1',
      iss: 'tourkit.dev',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 86400,
      email: 'test@example.com',
      tier: 'pro' as const,
      packages: [],
      features: [],
      limits: { maxDomains: ['example.com'] },
    }
    expect(validateDomain(payload, 'other.com')).toBe(false)
  })

  it('supports wildcard domain patterns', () => {
    const payload = {
      sub: 'customer-1',
      iss: 'tourkit.dev',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 86400,
      email: 'test@example.com',
      tier: 'pro' as const,
      packages: [],
      features: [],
      limits: { maxDomains: ['*.example.com'] },
    }
    expect(validateDomain(payload, 'sub.example.com')).toBe(true)
    expect(validateDomain(payload, 'example.com')).toBe(true)
    expect(validateDomain(payload, 'other.com')).toBe(false)
  })
})

describe('getCurrentDomain', () => {
  it('returns null in node environment', () => {
    expect(getCurrentDomain()).toBeNull()
  })
})
