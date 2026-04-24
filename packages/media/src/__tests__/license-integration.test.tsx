import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @tour-kit/license — ProGate wraps each embed component
vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode; package: string }) => {
    return <>{children}</>
  },
}))

import { YouTubeEmbed } from '../components/embeds'

describe('YouTubeEmbed — license integration (ProGate)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders component when ProGate allows (licensed)', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

    expect(screen.getByTitle('Test Video')).toBeInTheDocument()
  })

  it('does not render watermark (hard gate replaces watermark)', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

    expect(screen.queryByText('UNLICENSED')).toBeNull()
    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
  })
})

describe('YouTubeEmbed — ProGate blocks when unlicensed', () => {
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

  it('shows placeholder instead of embed when unlicensed', async () => {
    const { YouTubeEmbed } = await import('../components/embeds')

    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

    expect(screen.getByTestId('pro-gate-placeholder')).toBeInTheDocument()
    expect(screen.getByText(/Tour Kit Pro license required/)).toBeInTheDocument()
    expect(screen.getByText(/@tour-kit\/media/)).toBeInTheDocument()
    expect(screen.queryByTitle('Test Video')).toBeNull()
  })
})

describe('TourMedia — internal embeds honor ProGate (regression)', () => {
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

  it('YouTube URL routes through gated embed (not the raw iframe)', async () => {
    const { TourMedia } = await import('../components/tour-media')

    render(<TourMedia src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" alt="demo" />)

    expect(screen.getByTestId('pro-gate-placeholder')).toBeInTheDocument()
    expect(screen.queryByTitle('demo')).toBeNull()
  })

  it('native video URL routes through gated embed', async () => {
    const { TourMedia } = await import('../components/tour-media')

    render(<TourMedia src="https://example.com/demo.mp4" alt="demo video" />)

    expect(screen.getByTestId('pro-gate-placeholder')).toBeInTheDocument()
    expect(screen.queryByLabelText('demo video')).toBeNull()
  })
})
