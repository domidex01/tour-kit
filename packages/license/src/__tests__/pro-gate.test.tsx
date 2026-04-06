import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProGate } from '../components/pro-gate'
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
  readCache: vi.fn(),
  writeCache: vi.fn(),
  hasFreshCache: vi.fn(),
}))

import { hasFreshCache } from '../lib/cache'
import { isDevEnvironment } from '../lib/domain'
import { validateLicenseKey } from '../lib/polar-client'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)
const mockHasFreshCache = vi.mocked(hasFreshCache)

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

const EXPIRED: LicenseState = {
  status: 'expired',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: '2024-01-01T00:00:00Z',
  validatedAt: Date.now(),
  renderKey: undefined,
}

const REVOKED: LicenseState = {
  status: 'revoked',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

const ERROR: LicenseState = {
  status: 'error',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

describe('ProGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
    mockHasFreshCache.mockReturnValue(false)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when license is valid', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <ProGate package="@tour-kit/adoption">
          <div data-testid="pro-content">Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('pro-content')).toHaveTextContent('Pro Feature')
    })

    expect(screen.queryByText('Tour Kit Pro license required')).not.toBeInTheDocument()
  })

  it('renders placeholder when license is invalid', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <ProGate package="@tour-kit/adoption">
          <div data-testid="pro-content">Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Tour Kit Pro license required')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(screen.getByText('@tour-kit/adoption')).toBeInTheDocument()
    expect(screen.getByText('Get a license →')).toBeInTheDocument()
  })

  it('renders placeholder when license is expired', async () => {
    mockValidate.mockResolvedValue(EXPIRED)

    render(
      <LicenseProvider licenseKey="expired_key">
        <ProGate package="@tour-kit/checklists">
          <div data-testid="pro-content">Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Tour Kit Pro license required')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  it('renders placeholder when license is revoked', async () => {
    mockValidate.mockResolvedValue(REVOKED)

    render(
      <LicenseProvider licenseKey="revoked_key">
        <ProGate package="@tour-kit/media">
          <div data-testid="pro-content">Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Tour Kit Pro license required')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  it('renders children during loading (avoids flash)', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <ProGate package="@tour-kit/adoption">
          <div data-testid="pro-content">Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    expect(screen.queryByText('Tour Kit Pro license required')).not.toBeInTheDocument()
  })

  it('renders children on error when fresh cache exists (grace period)', async () => {
    mockValidate.mockResolvedValue(ERROR)
    mockHasFreshCache.mockReturnValue(true)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <ProGate package="@tour-kit/analytics">
          <div data-testid="pro-content">Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    })

    expect(screen.queryByText('Tour Kit Pro license required')).not.toBeInTheDocument()
  })

  it('renders placeholder on error when no cache exists', async () => {
    mockValidate.mockResolvedValue(ERROR)
    mockHasFreshCache.mockReturnValue(false)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <ProGate package="@tour-kit/analytics">
          <div data-testid="pro-content">Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Tour Kit Pro license required')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  it('renders children in dev environment without LicenseProvider', () => {
    mockIsDev.mockReturnValue(true)

    render(
      <ProGate package="@tour-kit/adoption">
        <div data-testid="pro-content">Pro Feature</div>
      </ProGate>
    )

    expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    expect(screen.queryByText('Tour Kit Pro license required')).not.toBeInTheDocument()
  })

  it('renders placeholder when no LicenseProvider in tree (non-dev)', () => {
    mockIsDev.mockReturnValue(false)

    render(
      <ProGate package="@tour-kit/adoption">
        <div data-testid="pro-content">Pro Feature</div>
      </ProGate>
    )

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(screen.getByText('Tour Kit Pro license required')).toBeInTheDocument()
  })

  it('logs console.error when gated', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <ProGate package="@tour-kit/adoption">
          <div>Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('@tour-kit/adoption'))
    })
  })

  it('has accessible role and label on placeholder', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <ProGate package="@tour-kit/adoption">
          <div>Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      const placeholder = screen.getByRole('status')
      expect(placeholder).toHaveAttribute('aria-label', 'License required')
    })
  })

  it('pricing link opens in new tab', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <ProGate package="@tour-kit/adoption">
          <div>Pro Feature</div>
        </ProGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      const link = screen.getByText('Get a license →')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAttribute('href', 'https://tourkit.dev/pricing')
    })
  })
})
