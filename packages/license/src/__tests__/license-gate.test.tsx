import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { LicenseProvider, LicenseRenderContext } from '../context/license-context'
import { LicenseGate } from '../components/license-gate'
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

describe('LicenseGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('renders children when license is valid pro', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('pro-content')).toHaveTextContent('Pro Feature')
    })

    expect(screen.queryByText('UNLICENSED')).not.toBeInTheDocument()
  })

  it('renders children with watermark overlay when invalid and no fallback', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('UNLICENSED')).toBeInTheDocument()
      expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    })
  })

  it('renders fallback when license is invalid and fallback provided', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <LicenseGate require="pro" fallback={<div data-testid="fallback">Upgrade</div>}>
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveTextContent('Upgrade')
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(screen.queryByText('UNLICENSED')).not.toBeInTheDocument()
  })

  it('renders loading slot while validation is in flight', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate
          require="pro"
          loading={<div data-testid="loading">Loading...</div>}
        >
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  it('renders null when no loading slot provided and loading', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  it('renders watermark when tier is free but pro is required', async () => {
    mockValidate.mockResolvedValue(VALID_FREE)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    })
  })

  it('provides renderKey via LicenseRenderContext when license is valid', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    function RenderKeyConsumer() {
      const renderKey = useContext(LicenseRenderContext)
      return <span data-testid="inner-key">{renderKey ?? 'none'}</span>
    }

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <RenderKeyConsumer />
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('inner-key')).toHaveTextContent('lk_abc123hash')
    })
  })

  it('throws when used outside LicenseProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(
        <LicenseGate require="pro">
          <div>Pro Feature</div>
        </LicenseGate>
      )
    }).toThrow('useLicense must be used within a <LicenseProvider>')

    spy.mockRestore()
  })
})
