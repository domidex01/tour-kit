import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => <>{children}</>,
}))

import { YouTubeEmbed } from '../components/embeds'

describe('YouTubeEmbed — license integration (licensed)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders component when LicenseGate allows (licensed)', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

    expect(screen.getByTitle('Test Video')).toBeInTheDocument()
  })

  it('does not render the legacy hard placeholder copy when licensed', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
    expect(screen.queryByTestId('license-watermark')).toBeNull()
  })
})

describe('YouTubeEmbed — LicenseGate soft-gates when unlicensed', () => {
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

  it('renders the iframe plus the unlicensed badge when unlicensed', async () => {
    const { YouTubeEmbed } = await import('../components/embeds')

    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

    expect(screen.getByTitle('Test Video')).toBeInTheDocument()
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
    expect(screen.queryByText(/Tour Kit Pro license required/)).toBeNull()
  })
})

describe('TourMedia — routed embeds still go through LicenseGate', () => {
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

  it('YouTube URL renders the gated embed (iframe + badge)', async () => {
    const { TourMedia } = await import('../components/tour-media')

    render(<TourMedia src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" alt="demo" />)

    expect(screen.getByTitle('demo')).toBeInTheDocument()
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
  })

  it('native video URL renders the gated embed (video + badge)', async () => {
    const { TourMedia } = await import('../components/tour-media')

    render(<TourMedia src="https://example.com/demo.mp4" alt="demo video" />)

    expect(screen.getByLabelText('demo video')).toBeInTheDocument()
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
  })
})
