import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LicenseProvider } from '../context/license-context'
import { useLicense } from '../hooks/use-license'
import { useIsPro } from '../hooks/use-is-pro'
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
}))

import { validateLicenseKey } from '../lib/polar-client'
import { isDevEnvironment } from '../lib/domain'

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

const VALID_FREE: LicenseState = {
  status: 'valid',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_free456hash',
}

const INVALID: LicenseState = {
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 5,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

const EXPIRED: LicenseState = {
  status: 'expired',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: '2025-01-01T00:00:00Z',
  validatedAt: Date.now(),
  renderKey: undefined,
}

function createWrapper(licenseKey = 'TOURKIT_key') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LicenseProvider licenseKey={licenseKey}>
        {children}
      </LicenseProvider>
    )
  }
}

describe('useLicense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  it('returns LicenseContextValue inside provider', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    const { result } = renderHook(() => useLicense(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.state.status).toBe('valid')
    })

    expect(result.current.state).toEqual(VALID_PRO)
    expect(typeof result.current.refresh).toBe('function')
  })

  it('throws with clear message when used outside LicenseProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useLicense())
    }).toThrow('useLicense must be used within a <LicenseProvider>')

    spy.mockRestore()
  })
})

describe('useIsPro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  it('returns true when status is valid and tier is pro', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('returns false when tier is free', async () => {
    mockValidate.mockResolvedValue(VALID_FREE)

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('returns false while loading (no flash of pro content)', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    expect(result.current).toBe(false)
  })

  it('returns false when license is invalid', async () => {
    mockValidate.mockResolvedValue(INVALID)

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('returns false when tier is pro but status is expired', async () => {
    mockValidate.mockResolvedValue(EXPIRED)

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})
