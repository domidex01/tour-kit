import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentDomain, isDevEnvironment, validateDomainAtRender } from '../lib/domain'

beforeEach(() => {
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('location', { hostname: 'example.com' })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('getCurrentDomain', () => {
  it('returns window.location.hostname', () => {
    vi.stubGlobal('location', { hostname: 'myapp.com' })
    expect(getCurrentDomain()).toBe('myapp.com')
  })

  it('returns null when window is undefined (SSR)', () => {
    vi.stubGlobal('window', undefined)
    expect(getCurrentDomain()).toBeNull()
  })
})

describe('isDevEnvironment', () => {
  it('returns true for localhost', () => {
    vi.stubGlobal('location', { hostname: 'localhost' })
    expect(isDevEnvironment()).toBe(true)
  })

  it('returns true for 127.0.0.1', () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1' })
    expect(isDevEnvironment()).toBe(true)
  })

  it('returns true for myapp.local', () => {
    vi.stubGlobal('location', { hostname: 'myapp.local' })
    expect(isDevEnvironment()).toBe(true)
  })

  it('returns false for example.com', () => {
    vi.stubGlobal('location', { hostname: 'example.com' })
    expect(isDevEnvironment()).toBe(false)
  })

  it('returns false when window is undefined (SSR)', () => {
    vi.stubGlobal('window', undefined)
    expect(isDevEnvironment()).toBe(false)
  })
})

describe('validateDomainAtRender', () => {
  it('returns true when hostname matches activation label', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('location', { hostname: 'example.com' })
    expect(validateDomainAtRender('example.com')).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns false and logs warning on hostname mismatch', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('location', { hostname: 'other.com' })
    expect(validateDomainAtRender('example.com')).toBe(false)
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  it('warning message includes both domains', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('location', { hostname: 'other.com' })
    validateDomainAtRender('example.com')
    const message = warnSpy.mock.calls[0]?.[0] as string
    expect(message).toContain('example.com')
    expect(message).toContain('other.com')
  })

  it('returns true in SSR (no window)', () => {
    vi.stubGlobal('window', undefined)
    expect(validateDomainAtRender('example.com')).toBe(true)
  })

  it('returns true in dev environment (skip check)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('location', { hostname: 'localhost' })
    expect(validateDomainAtRender('example.com')).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns true for 127.0.0.1 (dev bypass)', () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1' })
    expect(validateDomainAtRender('production.com')).toBe(true)
  })
})
