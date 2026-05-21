import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TrialBadge } from '../components/trial-badge'
import { LicenseProvider } from '../context/license-context'

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
import type { LicenseState } from '../types'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)

const DAY = 86_400_000

function makeState(now: number): LicenseState {
  return {
    status: 'valid',
    tier: 'pro',
    activations: 1,
    maxActivations: 5,
    domain: 'example.com',
    expiresAt: null,
    validatedAt: now,
    serverValidatedAt: now,
    renderKey: 'lk_test',
  }
}

describe('<TrialBadge>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('renders "14 days left" when daysLeft={14}', () => {
    render(<TrialBadge daysLeft={14} />)
    expect(screen.getByText('14 days left')).toBeInTheDocument()
  })

  it('renders "4 days left" when daysLeft={4} (above threshold)', () => {
    render(<TrialBadge daysLeft={4} />)
    expect(screen.getByText('4 days left')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument()
  })

  it.each([3, 1, 0])('becomes Upgrade <a> at daysLeft=%i', (daysLeft) => {
    render(<TrialBadge daysLeft={daysLeft} />)
    const link = screen.getByRole('link', { name: /upgrade/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBeTruthy()
    expect(link.getAttribute('href')).not.toBe('#')
  })

  it('honors custom pricingUrl on the Upgrade anchor', () => {
    render(<TrialBadge daysLeft={2} pricingUrl="https://my.example/upgrade" />)
    const link = screen.getByRole('link', { name: /upgrade/i })
    expect(link.getAttribute('href')).toBe('https://my.example/upgrade')
  })

  it('reads daysLeft from useLicense().trial when no prop is passed', async () => {
    const issuedAt = Date.now()
    mockValidate.mockResolvedValue(makeState(issuedAt))

    render(
      <LicenseProvider licenseKey="TOURKIT_key" trialDays={14} trialIssuedAt={issuedAt}>
        <TrialBadge />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('14 days left')).toBeInTheDocument()
    })
  })

  it('renders null and warns in dev when no trialDays in context and no prop', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('NODE_ENV', 'development')
    mockValidate.mockResolvedValue({
      status: 'valid',
      tier: 'pro',
      activations: 1,
      maxActivations: 5,
      domain: 'example.com',
      expiresAt: null,
      validatedAt: Date.now(),
      serverValidatedAt: null,
      renderKey: 'lk_test',
    })

    const { container } = render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <TrialBadge />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy.mock.calls[0]?.[0]).toContain('<TrialBadge>')
    warnSpy.mockRestore()
  })

  it('headless render-prop receives { daysLeft, isTrialing, isUrgent }', () => {
    const renderProp = vi.fn(({ daysLeft }: { daysLeft: number }) => (
      <span data-testid="custom-render">days={daysLeft}</span>
    ))
    render(<TrialBadge daysLeft={7}>{renderProp}</TrialBadge>)
    expect(renderProp).toHaveBeenCalled()
    const arg = renderProp.mock.calls[0]?.[0]
    expect(arg).toEqual({ daysLeft: 7, isTrialing: true, isUrgent: false })
    expect(screen.getByTestId('custom-render')).toHaveTextContent('days=7')
  })

  it('transitions from countdown to Upgrade across day boundary via system-time jump', async () => {
    const issuedAt = ISO_FIXED
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(issuedAt)
    mockValidate.mockResolvedValue({
      status: 'valid',
      tier: 'pro',
      activations: 1,
      maxActivations: 5,
      domain: 'example.com',
      expiresAt: null,
      validatedAt: issuedAt,
      serverValidatedAt: issuedAt,
      renderKey: 'lk_test',
    })

    const { rerender } = render(
      <LicenseProvider licenseKey="TOURKIT_key" trialDays={14} trialIssuedAt={issuedAt}>
        <TrialBadge />
      </LicenseProvider>
    )

    // First-tick: still in trial
    await waitFor(() => {
      expect(screen.getByText('14 days left')).toBeInTheDocument()
    })

    // Jump 11 days — re-mount via fresh state to recompute trial slice
    vi.setSystemTime(issuedAt + 11 * DAY)
    mockValidate.mockResolvedValue({
      status: 'valid',
      tier: 'pro',
      activations: 1,
      maxActivations: 5,
      domain: 'example.com',
      expiresAt: null,
      validatedAt: issuedAt + 11 * DAY,
      serverValidatedAt: issuedAt + 11 * DAY,
      renderKey: 'lk_test',
    })
    rerender(
      <LicenseProvider
        key="rebuild"
        licenseKey="TOURKIT_key2"
        trialDays={14}
        trialIssuedAt={issuedAt}
      >
        <TrialBadge />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /upgrade/i })).toBeInTheDocument()
    })
  })
})

const ISO_FIXED = 1_700_000_000_000
