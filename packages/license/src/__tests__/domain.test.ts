import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentDomain,
  isDevEnvironment,
  isEphemeralHost,
  validateDomainAtRender,
} from '../lib/domain'

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

describe('isEphemeralHost', () => {
  it.each([
    'acme-git-main-team.vercel.app',
    'acme-9f2a3b7c1-team.vercel.app',
    'feat-login--my-site.netlify.app',
    'deploy-preview-42--my-site.netlify.app',
    'a1b2c3d4.my-project.pages.dev',
    'abc123.ngrok-free.app',
    'demo.ngrok.io',
    'tunnel.loca.lt',
    'random.trycloudflare.com',
    '203.0.113.7',
    '[2001:db8::1]',
  ])('returns true for ephemeral/preview host %s', (host) => {
    expect(isEphemeralHost(host)).toBe(true)
  })

  it.each([
    'usertourkit.com',
    'app.acme.com',
    'acme.vercel.app', // bare production alias — must still require a license
    'my-site.netlify.app', // bare production alias
    'docs.pages.dev',
  ])('returns false for stable production host %s', (host) => {
    expect(isEphemeralHost(host)).toBe(false)
  })

  it('returns false for null / SSR', () => {
    expect(isEphemeralHost(null)).toBe(false)
  })

  it('reads window.location.hostname when no argument is given', () => {
    vi.stubGlobal('location', { hostname: 'x-git-branch-team.vercel.app' })
    expect(isEphemeralHost()).toBe(true)
  })
})
