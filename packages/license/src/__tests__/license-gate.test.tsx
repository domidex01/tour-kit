import { render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseGate } from '../components/license-gate'
import { LicenseProvider, LicenseRenderContext } from '../context/license-context'
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

const ORIGINAL_NODE_ENV = process.env.NODE_ENV

function findWatermark() {
  return document.body.querySelector('[data-tourkit-watermark]')
}

describe('LicenseGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
    document.body.innerHTML = ''
  })

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV
  })

  it('renders children when license is valid pro and no badge appears', async () => {
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

    expect(findWatermark()).toBeNull()
  })

  it('renders children plus badge when invalid and no fallback', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('pro-content')).toBeInTheDocument()
      expect(findWatermark()).not.toBeNull()
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
    expect(findWatermark()).toBeNull()
  })

  it('renders loading slot while validation is in flight', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro" loading={<div data-testid="loading">Loading...</div>}>
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

  it('renders children plus badge when tier is free but pro is required', async () => {
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
      expect(findWatermark()).not.toBeNull()
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

  it('does not throw when used outside LicenseProvider on a non-dev host', () => {
    mockIsDev.mockReturnValue(false)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => {
      render(
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      )
    }).not.toThrow()

    expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    expect(findWatermark()).not.toBeNull()

    warnSpy.mockRestore()
  })

  it('renders children only outside LicenseProvider on a dev host (no badge)', () => {
    mockIsDev.mockReturnValue(true)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <LicenseGate require="pro">
        <div data-testid="pro-content">Pro Feature</div>
      </LicenseGate>
    )

    expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    expect(findWatermark()).toBeNull()
    expect(warnSpy).not.toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('warns once when no provider and NODE_ENV is not production', async () => {
    mockIsDev.mockReturnValue(false)
    process.env.NODE_ENV = 'development'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <LicenseGate require="pro">
        <div data-testid="pro-content">Pro Feature</div>
      </LicenseGate>
    )

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalled()
    })

    const calls = warnSpy.mock.calls
    const tourkitCalls = calls.filter((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('[TourKit]'))
    )
    expect(tourkitCalls.length).toBeGreaterThanOrEqual(1)

    warnSpy.mockRestore()
  })

  it('does not warn when no provider and NODE_ENV is production', () => {
    mockIsDev.mockReturnValue(false)
    process.env.NODE_ENV = 'production'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <LicenseGate require="pro">
        <div data-testid="pro-content">Pro Feature</div>
      </LicenseGate>
    )

    expect(warnSpy).not.toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('renderToString does not throw or touch document on SSR', () => {
    mockIsDev.mockReturnValue(false)

    expect(() => {
      renderToString(
        <LicenseGate require="pro">
          <div>Pro Feature</div>
        </LicenseGate>
      )
    }).not.toThrow()
  })
})
