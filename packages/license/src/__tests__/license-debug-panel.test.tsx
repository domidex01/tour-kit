import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseDebugPanel } from '../components/license-debug-panel'
import { LicenseProvider } from '../context/license-context'

vi.mock('../lib/polar-client', () => ({
  validateLicenseKey: vi.fn(),
}))

vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
  getCurrentDomain: vi.fn(),
}))

vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
  hasFreshCache: vi.fn().mockReturnValue(false),
}))

import { getCurrentDomain, isDevEnvironment } from '../lib/domain'
import { validateLicenseKey } from '../lib/polar-client'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)
const mockGetDomain = vi.mocked(getCurrentDomain)

describe('<LicenseDebugPanel>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(true)
    mockGetDomain.mockReturnValue('localhost')
    vi.stubEnv('NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY', 'test-key')
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('renders the EXACT dev-bypass copy (literal — no regex)', async () => {
    render(
      <LicenseProvider licenseKey="test-key">
        <LicenseDebugPanel />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          '🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)'
        )
      ).toBeInTheDocument()
    })
  })

  it('returns null in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { container } = render(
      <LicenseProvider licenseKey="test-key">
        <LicenseDebugPanel />
      </LicenseProvider>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the trial line when trial slice is present in context', async () => {
    render(
      <LicenseProvider licenseKey="test-key" trialDays={14}>
        <LicenseDebugPanel />
      </LicenseProvider>
    )
    await waitFor(() => {
      expect(screen.getByText(/Trial:/)).toBeInTheDocument()
    })
    expect(screen.getByText(/14/)).toBeInTheDocument()
  })

  it('renders status line (not dev-bypass line) when renderKey !== "dev_bypass"', async () => {
    mockIsDev.mockReturnValue(false)
    mockGetDomain.mockReturnValue('example.com')
    mockValidate.mockResolvedValue({
      status: 'invalid',
      tier: 'free',
      activations: 0,
      maxActivations: 0,
      domain: null,
      expiresAt: null,
      validatedAt: Date.now(),
      serverValidatedAt: null,
      renderKey: undefined,
    })

    render(
      <LicenseProvider licenseKey="test-key">
        <LicenseDebugPanel />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Status:/)).toBeInTheDocument()
    })
    expect(screen.queryByText(/Dev bypass active/)).not.toBeInTheDocument()
  })
})
