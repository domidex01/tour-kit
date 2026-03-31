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
  const mod = await import('../context/announcements-provider')
  return mod.AnnouncementsProvider
}

describe('AnnouncementsProvider — license integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('when @tour-kit/license is NOT installed', () => {
    beforeEach(() => {
      setupLicenseMock('not-installed')
    })

    it('renders children without errors', async () => {
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div data-testid="child">Hello</div>
        </AnnouncementsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('does not render watermark', async () => {
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div>Hello</div>
        </AnnouncementsProvider>
      )

      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div>Hello</div>
        </AnnouncementsProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('when @tour-kit/license is installed but license is invalid', () => {
    beforeEach(() => {
      setupLicenseMock('invalid')
    })

    it('renders children (soft enforcement)', async () => {
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div data-testid="child">Hello</div>
        </AnnouncementsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('renders UNLICENSED watermark overlay', async () => {
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div>Hello</div>
        </AnnouncementsProvider>
      )

      const watermark = screen.getByText('UNLICENSED')
      expect(watermark).toBeInTheDocument()
      expect(watermark).toHaveAttribute('aria-hidden', 'true')
    })

    it('fires console.warn with package name in development', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div>Hello</div>
        </AnnouncementsProvider>
      )

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('@tour-kit/announcements')
      )
    })
  })

  describe('when @tour-kit/license is installed with valid license', () => {
    beforeEach(() => {
      setupLicenseMock('valid')
    })

    it('renders children without watermark', async () => {
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div data-testid="child">Hello</div>
        </AnnouncementsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnnouncementsProvider = await importProvider()

      render(
        <AnnouncementsProvider>
          <div>Hello</div>
        </AnnouncementsProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
