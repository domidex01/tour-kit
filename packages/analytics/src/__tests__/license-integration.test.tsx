import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type LicenseState = 'not-installed' | 'invalid' | 'valid'

const LICENSE_RESULTS: Record<LicenseState, { isLicensed: boolean; isLoading: boolean }> = {
  'not-installed': { isLicensed: true, isLoading: false },
  invalid: { isLicensed: false, isLoading: false },
  valid: { isLicensed: true, isLoading: false },
}

function setupLicenseMock(state: LicenseState) {
  vi.resetModules()
  const result = LICENSE_RESULTS[state]
  vi.doMock('../lib/use-license-check', () => ({
    useLicenseCheck: () => result,
  }))
}

async function importProvider() {
  const mod = await import('../core/context')
  return mod.AnalyticsProvider
}

describe('AnalyticsProvider — license integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('when @tour-kit/license is NOT installed', () => {
    beforeEach(() => {
      setupLicenseMock('not-installed')
    })

    it('renders children without errors', async () => {
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div data-testid="child">Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('does not render watermark', async () => {
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('when @tour-kit/license is installed but license is invalid', () => {
    beforeEach(() => {
      setupLicenseMock('invalid')
    })

    it('renders children (soft enforcement)', async () => {
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div data-testid="child">Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('renders UNLICENSED watermark overlay', async () => {
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      const watermark = screen.getByText('UNLICENSED')
      expect(watermark).toBeInTheDocument()
      expect(watermark).toHaveAttribute('aria-hidden', 'true')
    })

    it('fires console.warn with package name in development', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('@tour-kit/analytics'))
    })

    it('analytics functionality still works when unlicensed', async () => {
      const AnalyticsProvider = await importProvider()
      const { useAnalytics } = await import('../core/context')

      function Consumer() {
        const analytics = useAnalytics()
        return <div data-testid="has-analytics">{analytics ? 'yes' : 'no'}</div>
      }

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <Consumer />
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('has-analytics')).toHaveTextContent('yes')
    })
  })

  describe('when @tour-kit/license is installed with valid license', () => {
    beforeEach(() => {
      setupLicenseMock('valid')
    })

    it('renders children without watermark', async () => {
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div data-testid="child">Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnalyticsProvider = await importProvider()

      render(
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
