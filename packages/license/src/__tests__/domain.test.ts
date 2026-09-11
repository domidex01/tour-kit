import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentDomain,
  isDevEnvironment,
  isEphemeralHost,
  toRegistrableDomain,
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

describe('toRegistrableDomain', () => {
  // The two regressions that cost money. A naive last-two-labels rule turns
  // `foo.co.uk` into `co.uk` and `x.vercel.app` into `vercel.app`, so one
  // Starter key would cover every site on a registry or every Vercel deploy.
  it('keeps foo.co.uk whole — never collapses to the public suffix co.uk', () => {
    expect(toRegistrableDomain('foo.co.uk')).toBe('foo.co.uk')
    expect(toRegistrableDomain('foo.co.uk')).not.toBe('co.uk')
    expect(toRegistrableDomain('app.foo.co.uk')).toBe('foo.co.uk')
  })

  it('keeps myapp.vercel.app whole — never collapses to vercel.app', () => {
    expect(toRegistrableDomain('myapp.vercel.app')).toBe('myapp.vercel.app')
    expect(toRegistrableDomain('myapp.vercel.app')).not.toBe('vercel.app')
  })

  it.each([
    'co.uk',
    'com.au',
    'com.br',
    'github.io',
    'pages.dev',
    'netlify.app',
    'herokuapp.com',
    'azurewebsites.net',
  ])('never returns the bare public suffix %s for a customer host', (suffix) => {
    expect(toRegistrableDomain(`customer.${suffix}`)).toBe(`customer.${suffix}`)
  })

  it('collapses subdomains onto one registrable domain', () => {
    for (const host of ['app.foo.com', 'www.foo.com', 'staging.eu.foo.com', 'a.b.c.d.foo.com']) {
      expect(toRegistrableDomain(host)).toBe('foo.com')
    }
  })

  it('leaves an already-registrable domain alone', () => {
    expect(toRegistrableDomain('foo.com')).toBe('foo.com')
  })

  it('is idempotent — it normalises the stored label as well as the live host', () => {
    const cases = [
      'app.foo.com',
      'foo.co.uk',
      'a.b.foo.co.uk',
      'myapp.vercel.app',
      'deploy.x.pages.dev',
      '192.168.1.10',
      '::1',
      '',
      'foo.com.',
      'deep.staging.eu.foo.com.au',
    ]
    for (const host of cases) {
      const once = toRegistrableDomain(host)
      expect(toRegistrableDomain(once)).toBe(once)
    }
  })

  it('passes IPv4 and IPv6 hosts through untouched', () => {
    expect(toRegistrableDomain('192.168.1.10')).toBe('192.168.1.10')
    expect(toRegistrableDomain('127.0.0.1')).toBe('127.0.0.1')
    expect(toRegistrableDomain('::1')).toBe('::1')
    expect(toRegistrableDomain('[::1]')).toBe('[::1]')
  })

  it('handles empty input and a trailing dot without throwing', () => {
    expect(toRegistrableDomain('')).toBe('')
    expect(toRegistrableDomain('foo.com.')).toBe('foo.com')
    expect(toRegistrableDomain('app.FOO.com')).toBe('foo.com')
  })

  it('hands back the original when normalisation would empty it', () => {
    // Deliberately NOT '': two different unusable hostnames must stay unequal,
    // or they would both normalise to '' and compare equal to each other in
    // validateDomainAtRender.
    expect(toRegistrableDomain('   ')).toBe('   ')
    expect(toRegistrableDomain('.')).toBe('.')
  })

  it('handles a single-label host', () => {
    expect(toRegistrableDomain('localhost')).toBe('localhost')
  })
})

describe('validateDomainAtRender — registrable-domain round trip', () => {
  it('a key activated on app.foo.com validates on foo.com and www.foo.com', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // The label a pre-normalisation activation would have stored.
    const storedLabel = 'app.foo.com'
    for (const hostname of ['foo.com', 'www.foo.com', 'app.foo.com', 'staging.foo.com']) {
      vi.stubGlobal('location', { hostname })
      expect(validateDomainAtRender(storedLabel)).toBe(true)
    }
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('still rejects a genuinely different registrable domain', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('location', { hostname: 'app.other.com' })
    expect(validateDomainAtRender('app.foo.com')).toBe(false)
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  it('does not let one .co.uk key validate another .co.uk site', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('location', { hostname: 'www.somebodyelse.co.uk' })
    expect(validateDomainAtRender('www.mysite.co.uk')).toBe(false)
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  it('does not let one vercel.app key validate another deployment', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('location', { hostname: 'theirapp.vercel.app' })
    expect(validateDomainAtRender('myapp.vercel.app')).toBe(false)
    expect(warnSpy).toHaveBeenCalledOnce()
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
