import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => <>{children}</>,
}))

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
    createStorageAdapter: () => ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }),
  }
})

import { SurveysProvider } from '../context/surveys-provider'

describe('SurveysProvider — license integration (licensed)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when LicenseGate allows (licensed)', () => {
    render(
      <SurveysProvider>
        <div data-testid="child">Hello</div>
      </SurveysProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render the legacy hard placeholder copy when licensed', () => {
    render(
      <SurveysProvider>
        <div>Hello</div>
      </SurveysProvider>
    )

    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
    expect(screen.queryByTestId('license-watermark')).toBeNull()
  })
})

describe('SurveysProvider — LicenseGate soft-gates when unlicensed', () => {
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

  it('renders children plus the unlicensed badge', async () => {
    const { SurveysProvider } = await import('../context/surveys-provider')

    render(
      <SurveysProvider>
        <div data-testid="child">Hello</div>
      </SurveysProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
    expect(screen.queryByText(/Tour Kit Pro license required/)).toBeNull()
  })
})
