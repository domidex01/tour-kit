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
