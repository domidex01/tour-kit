import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseProvider } from '../context/license-context'
import type { LicenseState } from '../types'

vi.mock('../lib/polar-client', () => ({
  validateLicenseKey: vi.fn(),
}))

vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
  getCurrentDomain: vi.fn().mockReturnValue('example.com'),
}))

vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
  hasFreshCache: vi.fn().mockReturnValue(false),
}))

import { useLicenseGate } from '../hooks/use-license-gate'
import { isDevEnvironment } from '../lib/domain'
import { validateLicenseKey } from '../lib/polar-client'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)

const VALID_PRO: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_abc123hash',
}

function withProvider(licenseKey: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <LicenseProvider licenseKey={licenseKey}>{children}</LicenseProvider>
  }
}

describe('useLicenseGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  it('provider + empty key + dev host → eventually gated (provider precedence)', async () => {
    mockIsDev.mockReturnValue(true)

    const { result } = renderHook(() => useLicenseGate(), {
      wrapper: withProvider(''),
    })

    await waitFor(() => {
      expect(result.current).toEqual({ isGated: true, isLoading: false })
    })

    expect(mockValidate).not.toHaveBeenCalled()
  })

  it.each(['   ', '\t\n'])(
    'provider + whitespace key (%j) + dev host → eventually gated',
    async (key) => {
      mockIsDev.mockReturnValue(true)

      const { result } = renderHook(() => useLicenseGate(), {
        wrapper: withProvider(key),
      })

      await waitFor(() => {
        expect(result.current).toEqual({ isGated: true, isLoading: false })
      })

      expect(mockValidate).not.toHaveBeenCalled()
    }
  )

  it('provider + non-empty key + dev host → eventually not gated (dev_bypass)', async () => {
    mockIsDev.mockReturnValue(true)

    const { result } = renderHook(() => useLicenseGate(), {
      wrapper: withProvider('TOURKIT_local'),
    })

    await waitFor(() => {
      expect(result.current).toEqual({ isGated: false, isLoading: false })
    })

    expect(mockValidate).not.toHaveBeenCalled()
  })

  it('provider + valid pro license on production host → not gated', async () => {
    mockIsDev.mockReturnValue(false)
    mockValidate.mockResolvedValue(VALID_PRO)

    const { result } = renderHook(() => useLicenseGate(), {
      wrapper: withProvider('TOURKIT_key'),
    })

    await waitFor(() => {
      expect(result.current).toEqual({ isGated: false, isLoading: false })
    })
  })

  it('no provider + dev host → immediately not gated (no key to inspect)', () => {
    mockIsDev.mockReturnValue(true)

    const { result } = renderHook(() => useLicenseGate())

    expect(result.current).toEqual({ isGated: false, isLoading: false })
  })

  it('no provider + non-dev host → immediately gated', () => {
    mockIsDev.mockReturnValue(false)

    const { result } = renderHook(() => useLicenseGate())

    expect(result.current).toEqual({ isGated: true, isLoading: false })
  })
})

describe('useLicenseGate — activation-grace (Starter makes a 403 likely)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  // A Polar 403 means "the key is granted, but this domain could not claim a
  // slot" — the customer paid. `validateLicenseKey` turns that into a VALID
  // state on purpose (polar-client.ts step 5a) rather than an invalid one, and
  // this asserts the consequence a paying customer actually feels: no gate,
  // therefore no badge. On the old 5-slot key this was rare; on a Starter tier
  // with `maxActivations: 1` a second live domain trips it immediately.
  it('leaves isGated false when the activation limit is reached', async () => {
    mockValidate.mockResolvedValue({
      status: 'valid',
      tier: 'pro',
      activations: 1,
      maxActivations: 1,
      domain: 'example.com',
      expiresAt: null,
      validatedAt: Date.now(),
      serverValidatedAt: Date.now(),
      renderKey: 'lk_over_limit_hash',
    })

    const { result } = renderHook(() => useLicenseGate(), {
      wrapper: withProvider('TK-PAID-KEY'),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isGated).toBe(false)
  })

  // The other half of the grace: a transient network error gates only when
  // there is no fresh cache entry to fall back on.
  it('leaves isGated false on an error state while a fresh cache entry exists', async () => {
    const { hasFreshCache } = await import('../lib/cache')
    vi.mocked(hasFreshCache).mockReturnValue(true)
    mockValidate.mockResolvedValue({
      status: 'error',
      tier: 'free',
      activations: 0,
      maxActivations: 0,
      domain: null,
      expiresAt: null,
      validatedAt: Date.now(),
    } as LicenseState)

    const { result } = renderHook(() => useLicenseGate(), {
      wrapper: withProvider('TK-PAID-KEY'),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // `useLicenseGate` deliberately returns only { isGated, isLoading };
    // `gracePeriodActive` lives on the context for the debug panel. What
    // matters to a paying customer is this line: not gated, so no badge.
    expect(result.current.isGated).toBe(false)

    vi.mocked(hasFreshCache).mockReturnValue(false)
  })
})
