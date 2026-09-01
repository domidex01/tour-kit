import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TourMedia } from '../../components/tour-media'

function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reduce : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('TourMedia auto-detection', () => {
  it('renders a YouTube embed for a youtube.com URL', () => {
    render(<TourMedia src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" alt="YT tour" />)
    const iframe = screen.getByTitle('YT tour') as HTMLIFrameElement
    expect(iframe.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('renders a Vimeo embed for a vimeo.com URL', () => {
    render(<TourMedia src="https://vimeo.com/123456789" alt="Vimeo tour" />)
    expect((screen.getByTitle('Vimeo tour') as HTMLIFrameElement).src).toContain(
      'player.vimeo.com/video/123456789'
    )
  })

  it('renders a Loom embed for a loom.com URL', () => {
    render(<TourMedia src="https://www.loom.com/share/abc123" alt="Loom tour" />)
    expect((screen.getByTitle('Loom tour') as HTMLIFrameElement).src).toContain(
      'loom.com/embed/abc123'
    )
  })

  it('renders a Wistia embed for a wistia URL', () => {
    render(<TourMedia src="https://fast.wistia.net/embed/iframe/abc123" alt="Wistia tour" />)
    expect((screen.getByTitle('Wistia tour') as HTMLIFrameElement).src).toContain(
      'fast.wistia.net/embed/iframe/abc123'
    )
  })

  it('renders a native <video> for an .mp4 URL', () => {
    render(<TourMedia src="/videos/demo.mp4" alt="MP4 tour" />)
    const video = screen.getByLabelText('MP4 tour') as HTMLVideoElement
    expect(video.tagName).toBe('VIDEO')
    expect(video.getAttribute('src')).toBe('/videos/demo.mp4')
  })

  it('renders a GIF player (button + img) for a .gif URL', () => {
    render(<TourMedia src="/anim.gif" alt="GIF tour" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect((screen.getByAltText('GIF tour') as HTMLImageElement).getAttribute('src')).toBe(
      '/anim.gif'
    )
  })

  it('falls back to a plain <img> for an unknown / image URL', () => {
    render(<TourMedia src="/images/photo.png" alt="Image tour" />)
    const img = screen.getByAltText('Image tour') as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe('/images/photo.png')
  })

  it('wires onError through to the native video error message', () => {
    const onError = vi.fn()
    render(<TourMedia src="/videos/demo.mp4" alt="Err video" onError={onError} />)
    fireEvent.error(screen.getByLabelText('Err video'))
    expect(onError).toHaveBeenCalledWith('Failed to load video')
  })

  it('wires onError through to the image error message for the fallback path', () => {
    const onError = vi.fn()
    render(<TourMedia src="/images/photo.png" alt="Err img" onError={onError} />)
    fireEvent.error(screen.getByAltText('Err img'))
    expect(onError).toHaveBeenCalledWith('Failed to load image')
  })

  it('honors an explicit type over URL auto-detection', () => {
    // .png would normally render an image; force video instead
    render(<TourMedia src="/weird-name" type="video" alt="Forced video" />)
    expect((screen.getByLabelText('Forced video') as HTMLVideoElement).tagName).toBe('VIDEO')
  })

  it('renders the reduced-motion fallback image for animated media when reduce is on', () => {
    setReducedMotion(true)
    render(<TourMedia src="/anim.gif" alt="RM gif" reducedMotionFallback="/static-fallback.png" />)
    const img = screen.getByAltText('RM gif') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/static-fallback.png')
    // No play/pause button (GifPlayer) rendered in the fallback path
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('does NOT use the fallback when reduce is off (renders the real GifPlayer)', () => {
    setReducedMotion(false)
    render(
      <TourMedia src="/anim.gif" alt="Live gif" reducedMotionFallback="/static-fallback.png" />
    )
    // GifPlayer renders a button; the fallback path does not
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

afterEach(() => {
  // Restore the default no-preference matchMedia stub from setup.ts
  setReducedMotion(false)
})
