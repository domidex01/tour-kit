import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { LicenseProvider } from '../context/license-context'
import { useLicense } from '../hooks/use-license'
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
import { clearCache } from '../lib/cache'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)
const mockClearCache = vi.mocked(clearCache)

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

function TestConsumer() {
  const { state } = useLicense()
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="tier">{state.tier}</span>
      <span data-testid="renderKey">{state.renderKey ?? 'undefined'}</span>
    </div>
  )
}

describe('LicenseProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  it('renders children', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="test_key">
        <div data-testid="child">Hello</div>
      </LicenseProvider>
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('calls validateLicenseKey on mount', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key123">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledOnce()
      expect(mockValidate).toHaveBeenCalledWith('TOURKIT_key123')
    })
  })

  it('starts with status=loading, then resolves to validated state', async () => {
    let resolveValidation!: (value: LicenseState) => void
    mockValidate.mockImplementation(
      () => new Promise((resolve) => { resolveValidation = resolve })
    )

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <TestConsumer />
      </LicenseProvider>
    )

    // Initially loading
    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    expect(screen.getByTestId('renderKey')).toHaveTextContent('undefined')

    // Resolve validation
    await act(async () => {
      resolveValidation(VALID_PRO)
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('lk_abc123hash')
    })
  })

  it('sets state from validateLicenseKey result', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('lk_abc123hash')
    })
  })

  it('sets error state when validation fails', async () => {
    mockValidate.mockResolvedValue({
      status: 'error',
      tier: 'free',
      activations: 0,
      maxActivations: 0,
      domain: null,
      expiresAt: null,
      validatedAt: Date.now(),
      renderKey: undefined,
    })

    render(
      <LicenseProvider licenseKey="bad_key">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
      expect(screen.getByTestId('tier')).toHaveTextContent('free')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('undefined')
    })
  })

  it('calls onError callback when validateLicenseKey rejects', async () => {
    const error = new Error('Network failure')
    mockValidate.mockRejectedValue(error)
    const onError = vi.fn()

    render(
      <LicenseProvider licenseKey="bad_key" onError={onError}>
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
      expect(onError).toHaveBeenCalledOnce()
    })
  })

  it('skips validation in dev mode and returns valid pro with dev_bypass renderKey', async () => {
    mockIsDev.mockReturnValue(true)

    render(
      <LicenseProvider licenseKey="">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('dev_bypass')
    })

    expect(mockValidate).not.toHaveBeenCalled()
  })

  it('refresh() clears cache and re-validates', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    function RefreshConsumer() {
      const { refresh, state } = useLicense()
      return (
        <div>
          <span data-testid="status">{state.status}</span>
          <button data-testid="refresh" onClick={() => refresh()}>Refresh</button>
        </div>
      )
    }

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <RefreshConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
    })

    expect(mockValidate).toHaveBeenCalledTimes(1)

    // Trigger refresh
    await act(async () => {
      screen.getByTestId('refresh').click()
    })

    await waitFor(() => {
      expect(mockClearCache).toHaveBeenCalledOnce()
      expect(mockValidate).toHaveBeenCalledTimes(2)
    })
  })
})
