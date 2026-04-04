import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @tour-kit/license — ProGate is the hard gate used by the provider
vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode; package: string }) => {
    return <>{children}</>
  },
}))

import { AnalyticsProvider } from '../core/context'

describe('AnalyticsProvider — license integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when ProGate allows (licensed)', () => {
    render(
      <AnalyticsProvider config={{ plugins: [], enabled: false }}>
        <div data-testid="child">Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render watermark (hard gate replaces watermark)', () => {
    render(
      <AnalyticsProvider config={{ plugins: [], enabled: false }}>
        <div>Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.queryByText('UNLICENSED')).toBeNull()
    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
  })
})

describe('AnalyticsProvider — ProGate blocks when unlicensed', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@tour-kit/license', () => ({
      ProGate: ({ package: pkg }: { children: React.ReactNode; package: string }) => (
        <div data-testid="pro-gate-placeholder">Tour Kit Pro license required — {pkg}</div>
      ),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows placeholder instead of children when unlicensed', async () => {
    const { AnalyticsProvider } = await import('../core/context')

    render(
      <AnalyticsProvider config={{ plugins: [], enabled: false }}>
        <div data-testid="child">Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('pro-gate-placeholder')).toBeInTheDocument()
    expect(screen.getByText(/Tour Kit Pro license required/)).toBeInTheDocument()
    expect(screen.getByText(/@tour-kit\/analytics/)).toBeInTheDocument()
    expect(screen.queryByTestId('child')).toBeNull()
  })
})
