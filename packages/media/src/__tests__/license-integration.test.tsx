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

async function importYouTubeEmbed() {
  const mod = await import('../components/embeds')
  return mod.YouTubeEmbed
}

describe('YouTubeEmbed — license integration (HOC)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('when @tour-kit/license is NOT installed', () => {
    beforeEach(() => {
      setupLicenseMock('not-installed')
    })

    it('renders component without errors', async () => {
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      expect(screen.getByTitle('Test Video')).toBeInTheDocument()
    })

    it('does not render watermark', async () => {
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('when @tour-kit/license is installed but license is invalid', () => {
    beforeEach(() => {
      setupLicenseMock('invalid')
    })

    it('renders component (soft enforcement)', async () => {
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      expect(screen.getByTitle('Test Video')).toBeInTheDocument()
    })

    it('renders UNLICENSED watermark overlay', async () => {
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      const watermark = screen.getByText('UNLICENSED')
      expect(watermark).toBeInTheDocument()
      expect(watermark).toHaveAttribute('aria-hidden', 'true')
    })

    it('fires console.warn with package name in development', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('@tour-kit/media')
      )
    })
  })

  describe('when @tour-kit/license is installed with valid license', () => {
    beforeEach(() => {
      setupLicenseMock('valid')
    })

    it('renders component without watermark', async () => {
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      expect(screen.getByTitle('Test Video')).toBeInTheDocument()
      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const YouTubeEmbed = await importYouTubeEmbed()

      render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
