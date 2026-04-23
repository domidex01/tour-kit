import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @tour-kit/license — ProGate is the hard gate used by the provider
vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode; package: string }) => {
    return <>{children}</>
  },
}))

// Mock @tour-kit/core to avoid requiring TourProvider
vi.mock('@tour-kit/core', () => ({
  useTourContext: () => ({ isActive: false }),
  useTourContextOptional: () => ({ isActive: false }),
  createStorageAdapter: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}))

import { SurveysProvider } from '../context/surveys-provider'

describe('SurveysProvider — license integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when ProGate allows (licensed)', () => {
    render(
      <SurveysProvider>
        <div data-testid="child">Hello</div>
      </SurveysProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render watermark (hard gate replaces watermark)', () => {
    render(
      <SurveysProvider>
        <div>Hello</div>
      </SurveysProvider>
    )

    expect(screen.queryByText('UNLICENSED')).toBeNull()
    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
  })
})

describe('SurveysProvider — ProGate blocks when unlicensed', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@tour-kit/license', () => ({
      ProGate: ({ package: pkg }: { children: React.ReactNode; package: string }) => (
        <div data-testid="pro-gate-placeholder">Tour Kit Pro license required — {pkg}</div>
      ),
    }))
    vi.doMock('@tour-kit/core', () => ({
      useTourContext: () => ({ isActive: false }),
      useTourContextOptional: () => ({ isActive: false }),
      createStorageAdapter: () => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows placeholder instead of children when unlicensed', async () => {
    const { SurveysProvider } = await import('../context/surveys-provider')

    render(
      <SurveysProvider>
        <div data-testid="child">Hello</div>
      </SurveysProvider>
    )

    expect(screen.getByTestId('pro-gate-placeholder')).toBeInTheDocument()
    expect(screen.getByText(/Tour Kit Pro license required/)).toBeInTheDocument()
    expect(screen.getByText(/@tour-kit\/surveys/)).toBeInTheDocument()
    expect(screen.queryByTestId('child')).toBeNull()
  })
})
