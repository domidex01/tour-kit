import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @tour-kit/license — LicenseGate renders children unconditionally for the licensed case
vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => <>{children}</>,
}))

import { AdoptionProvider } from '../context/adoption-provider'

describe('AdoptionProvider — license integration (licensed)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when LicenseGate allows (licensed)', () => {
    render(
      <AdoptionProvider features={[]}>
        <div data-testid="child">Hello</div>
      </AdoptionProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render the legacy hard placeholder copy when licensed', () => {
    render(
      <AdoptionProvider features={[]}>
        <div>Hello</div>
      </AdoptionProvider>
    )

    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
    expect(screen.queryByTestId('license-watermark')).toBeNull()
  })
})

describe('AdoptionProvider — LicenseGate soft-gates when unlicensed', () => {
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
    const { AdoptionProvider } = await import('../context/adoption-provider')

    render(
      <AdoptionProvider features={[]}>
        <div data-testid="child">Hello</div>
      </AdoptionProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
    expect(screen.queryByText(/Tour Kit Pro license required/)).toBeNull()
  })
})
