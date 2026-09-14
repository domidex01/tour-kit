/**
 * `startLicenseGate()` — the branch logic behind the Vue and Svelte badge.
 *
 * This file exists because the binding tests could not cover it. They mount a
 * real provider on a dev host or with no key, which reaches three branches; the
 * ones that decide whether a PAYING customer's production app wears the badge
 * all live behind `validateLicenseKey`, and were untested. Worse, no test in
 * this package imported the module at all, so v8 never listed it and the 80%
 * coverage gate could not see the gap.
 *
 * Mocking follows `license-gate.test.tsx`: the three leaf modules are replaced,
 * so a case is one state object rather than a fetch fixture.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LicenseState } from '../types'

vi.mock('../lib/polar-client', () => ({ validateLicenseKey: vi.fn() }))
vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
  getCurrentDomain: vi.fn().mockReturnValue('example.com'),
}))
vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
  hasFreshCache: vi.fn().mockReturnValue(false),
}))

import { hasFreshCache } from '../lib/cache'
import { isDevEnvironment } from '../lib/domain'
import { startLicenseGate } from '../lib/license-gate-dom'
import { validateLicenseKey } from '../lib/polar-client'
import { __resetLicenseWarningForTests, __resetWatermarkForTests } from '../lib/watermark-dom'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)
const mockHasFreshCache = vi.mocked(hasFreshCache)

const state = (over: Partial<LicenseState> = {}): LicenseState => ({
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  serverValidatedAt: null,
  renderKey: undefined,
  ...over,
})

const LICENSED = state({ status: 'valid', tier: 'pro', renderKey: 'lk_abc123hash' })

const badges = () => document.body.querySelectorAll('[data-tourkit-watermark]')

/** Let the validation promise and its handler settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  // The shared setup's `afterEach` wipes `document.body.innerHTML`, which
  // detaches the badge without telling this module — exactly the drift the
  // reset exists for. Without it the hold count carries between tests.
  __resetWatermarkForTests()
  __resetLicenseWarningForTests()
  mockIsDev.mockReturnValue(false)
  mockHasFreshCache.mockReturnValue(false)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  __resetWatermarkForTests()
  vi.restoreAllMocks()
})

describe('startLicenseGate — no key', () => {
  it('badges a production host and never calls the issuer', async () => {
    const release = startLicenseGate()
    await settle()

    expect(badges()).toHaveLength(1)
    // A missing key is unlicensed by inspection; asking Polar about "" would
    // be a wasted round trip on every page load.
    expect(mockValidate).not.toHaveBeenCalled()
    release()
    expect(badges()).toHaveLength(0)
  })

  it('warns but does not badge a development host', async () => {
    mockIsDev.mockReturnValue(true)

    startLicenseGate()
    await settle()

    expect(badges()).toHaveLength(0)
    expect(console.warn).toHaveBeenCalledOnce()
  })
})

describe('startLicenseGate — with a key', () => {
  it('does NOT badge a licensed production app', async () => {
    mockValidate.mockResolvedValue(LICENSED)

    startLicenseGate({ licenseKey: 'tk_live_key' })
    await settle()

    // The case that costs money if it regresses.
    expect(badges()).toHaveLength(0)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('badges an invalid key', async () => {
    mockValidate.mockResolvedValue(state({ status: 'invalid' }))

    startLicenseGate({ licenseKey: 'tk_live_key' })
    await settle()

    expect(badges()).toHaveLength(1)
  })

  it('skips the issuer entirely on a development host', async () => {
    mockIsDev.mockReturnValue(true)

    startLicenseGate({ licenseKey: 'tk_live_key' })
    await settle()

    // Local work must never consume one of the key's finite activation slots.
    expect(mockValidate).not.toHaveBeenCalled()
    expect(badges()).toHaveLength(0)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('passes organizationId and apiBase through to the issuer', async () => {
    mockValidate.mockResolvedValue(LICENSED)

    startLicenseGate({
      licenseKey: 'tk_live_key',
      organizationId: 'org_1',
      apiBase: 'https://x.dev',
    })
    await settle()

    expect(mockValidate).toHaveBeenCalledWith('tk_live_key', 'org_1', { apiBase: 'https://x.dev' })
  })

  it('trims the key before sending it', async () => {
    mockValidate.mockResolvedValue(LICENSED)

    startLicenseGate({ licenseKey: '  tk_live_key\n' })
    await settle()

    // An env var with a trailing newline is a real way to lose a paid licence.
    expect(mockValidate).toHaveBeenCalledWith('tk_live_key', undefined, undefined)
  })
})

describe('startLicenseGate — the issuer is unreachable', () => {
  it('holds off the badge while the cache is fresh', async () => {
    mockValidate.mockResolvedValue(state({ status: 'error' }))
    mockHasFreshCache.mockReturnValue(true)

    startLicenseGate({ licenseKey: 'tk_live_key' })
    await settle()

    // A network blip inside the 72h TTL is not an unlicensed app.
    expect(badges()).toHaveLength(0)
  })

  it('badges once the cache has gone stale', async () => {
    mockValidate.mockResolvedValue(state({ status: 'error' }))
    mockHasFreshCache.mockReturnValue(false)

    startLicenseGate({ licenseKey: 'tk_live_key' })
    await settle()

    expect(badges()).toHaveLength(1)
  })

  it('treats a THROWN validation as the same error state, with the same grace', async () => {
    mockValidate.mockRejectedValue(new Error('network down'))
    mockHasFreshCache.mockReturnValue(true)

    startLicenseGate({ licenseKey: 'tk_live_key' })
    await settle()

    expect(badges()).toHaveLength(0)
  })

  it('badges a thrown validation with no cache, and never rejects', async () => {
    mockValidate.mockRejectedValue(new Error('network down'))

    // An unhandled rejection here would surface in the consumer's app, not ours.
    startLicenseGate({ licenseKey: 'tk_live_key' })
    await settle()

    expect(badges()).toHaveLength(1)
  })
})

describe('startLicenseGate — lifecycle', () => {
  it('a release before the issuer answers cancels the badge', async () => {
    let resolve: (s: LicenseState) => void = () => {}
    mockValidate.mockReturnValue(
      new Promise<LicenseState>((r) => {
        resolve = r
      })
    )

    const release = startLicenseGate({ licenseKey: 'tk_live_key' })
    release()
    resolve(state({ status: 'invalid' }))
    await settle()

    // The provider unmounted mid-flight; nothing may appear afterwards.
    expect(badges()).toHaveLength(0)
  })

  it('two gates show one badge, and it survives the first release', async () => {
    const first = startLicenseGate()
    const second = startLicenseGate()
    await settle()

    expect(badges()).toHaveLength(1)
    first()
    expect(badges()).toHaveLength(1)
    second()
    expect(badges()).toHaveLength(0)
  })

  it('re-badges after the node is torn out from under it', async () => {
    const release = startLicenseGate()
    await settle()
    expect(badges()).toHaveLength(1)

    // A router clearing document.body, or anyone with devtools. Trusting the
    // cached node here left the page un-badged for the whole session.
    document.body.innerHTML = ''
    startLicenseGate()
    await settle()

    expect(badges()).toHaveLength(1)
    release()
  })

  it('warns once across several gates', async () => {
    startLicenseGate()
    startLicenseGate()
    await settle()

    expect(console.warn).toHaveBeenCalledOnce()
  })

  it('does nothing without a document', () => {
    const realDocument = globalThis.document
    // @ts-expect-error — modelling the server, where there is no document.
    globalThis.document = undefined

    try {
      expect(() => startLicenseGate()()).not.toThrow()
      expect(mockValidate).not.toHaveBeenCalled()
    } finally {
      globalThis.document = realDocument
    }
  })
})
