import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => <>{children}</>,
}))

import { AnalyticsProvider } from '../core/context'

describe('AnalyticsProvider — license integration (licensed)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when LicenseGate allows (licensed)', () => {
    render(
      <AnalyticsProvider config={{ plugins: [], enabled: false }}>
        <div data-testid="child">Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render the legacy hard placeholder copy when licensed', () => {
    render(
      <AnalyticsProvider config={{ plugins: [], enabled: false }}>
        <div>Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
    expect(screen.queryByTestId('license-watermark')).toBeNull()
  })
})

describe('AnalyticsProvider — LicenseGate soft-gates when unlicensed', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@tour-kit/license', () => ({
      LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => (
        <>
          {children}
          <div data-testid="license-watermark">Tour Kit · Unlicensed</div>
        </>
      ),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children plus the unlicensed badge', async () => {
    const { AnalyticsProvider } = await import('../core/context')

    render(
      <AnalyticsProvider config={{ plugins: [], enabled: false }}>
        <div data-testid="child">Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
    expect(screen.queryByText(/Tour Kit Pro license required/)).toBeNull()
  })
})
