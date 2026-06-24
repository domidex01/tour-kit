import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GifPlayer } from '../../components/embeds/gif-player'
import { LoomEmbed } from '../../components/embeds/loom-embed'
import { NativeVideo } from '../../components/embeds/native-video'
import { VimeoEmbed } from '../../components/embeds/vimeo-embed'
import { WistiaEmbed } from '../../components/embeds/wistia-embed'
import { YouTubeEmbed } from '../../components/embeds/youtube-embed'

describe('YouTubeEmbed', () => {
  it('renders an iframe pointing at youtube-nocookie with the video id', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Demo video" />)
    const iframe = screen.getByTitle('Demo video') as HTMLIFrameElement
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(iframe).toHaveAttribute('allowfullscreen')
    expect(iframe.getAttribute('allow')).toContain('autoplay')
  })

  it('reflects autoplay/muted options in the iframe src', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Auto" autoplay muted />)
    const iframe = screen.getByTitle('Auto') as HTMLIFrameElement
    expect(iframe.src).toContain('autoplay=1')
    expect(iframe.src).toContain('mute=1')
  })

  it('fires onLoad when the iframe loads', () => {
    const onLoad = vi.fn()
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="L" onLoad={onLoad} />)
    fireEvent.load(screen.getByTitle('L'))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('reflects controls=false and startTime in the iframe src', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Opts" controls={false} startTime={42} />)
    const iframe = screen.getByTitle('Opts') as HTMLIFrameElement
    expect(iframe.src).toContain('controls=0')
    expect(iframe.src).toContain('start=42')
  })
})

describe('VimeoEmbed', () => {
  it('renders an iframe to player.vimeo.com with the video id', () => {
    render(<VimeoEmbed videoId="123456789" title="Vimeo demo" />)
    const iframe = screen.getByTitle('Vimeo demo') as HTMLIFrameElement
    expect(iframe.src).toContain('player.vimeo.com/video/123456789')
    expect(iframe).toHaveAttribute('allowfullscreen')
  })

  it('reflects loop option in the iframe src', () => {
    render(<VimeoEmbed videoId="123456789" title="Loop" loop />)
    expect((screen.getByTitle('Loop') as HTMLIFrameElement).src).toContain('loop=1')
  })

  it('fires onLoad when the iframe loads', () => {
    const onLoad = vi.fn()
    render(<VimeoEmbed videoId="123456789" title="VL" onLoad={onLoad} />)
    fireEvent.load(screen.getByTitle('VL'))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })
})

describe('LoomEmbed', () => {
  it('renders an iframe to loom.com/embed with the video id', () => {
    render(<LoomEmbed videoId="abc123" title="Loom demo" />)
    const iframe = screen.getByTitle('Loom demo') as HTMLIFrameElement
    expect(iframe.src).toContain('loom.com/embed/abc123')
    expect(iframe).toHaveAttribute('allowfullscreen')
  })

  it('passes hideControls through to hide_controls param', () => {
    render(<LoomEmbed videoId="abc123" title="HC" hideControls />)
    expect((screen.getByTitle('HC') as HTMLIFrameElement).src).toContain('hide_controls=true')
  })

  it('fires onLoad when the iframe loads', () => {
    const onLoad = vi.fn()
    render(<LoomEmbed videoId="abc123" title="LL" onLoad={onLoad} />)
    fireEvent.load(screen.getByTitle('LL'))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })
})

describe('WistiaEmbed', () => {
  it('renders an iframe to fast.wistia.net with the video id', () => {
    render(<WistiaEmbed videoId="abc123" title="Wistia demo" />)
    const iframe = screen.getByTitle('Wistia demo') as HTMLIFrameElement
    expect(iframe.src).toContain('fast.wistia.net/embed/iframe/abc123')
    expect(iframe).toHaveAttribute('allowfullscreen')
  })

  it('passes controlsVisibleOnLoad=false through', () => {
    render(<WistiaEmbed videoId="abc123" title="NoCtl" controlsVisibleOnLoad={false} />)
    expect((screen.getByTitle('NoCtl') as HTMLIFrameElement).src).toContain(
      'controlsVisibleOnLoad=false'
    )
  })

  it('fires onLoad when the iframe loads', () => {
    const onLoad = vi.fn()
    render(<WistiaEmbed videoId="abc123" title="WL" onLoad={onLoad} />)
    fireEvent.load(screen.getByTitle('WL'))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })
})

describe('NativeVideo', () => {
  it('renders a <video> element with src and controls', () => {
    render(<NativeVideo src="/clip.mp4" alt="Native clip" controls />)
    const video = screen.getByLabelText('Native clip') as HTMLVideoElement
    expect(video.tagName).toBe('VIDEO')
    expect(video.getAttribute('src')).toBe('/clip.mp4')
    expect(video).toHaveAttribute('controls')
  })

  it('maps muted and loop props onto the element', () => {
    render(<NativeVideo src="/clip.mp4" alt="Muted clip" muted loop />)
    const video = screen.getByLabelText('Muted clip') as HTMLVideoElement
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
  })

  it('renders <source> and <track> children for sources and captions', () => {
    const { container } = render(
      <NativeVideo
        src="/clip.mp4"
        alt="With tracks"
        sources={[{ src: '/clip.webm', type: 'video/webm' }]}
        captions={[{ src: '/en.vtt', srclang: 'en', label: 'English', default: true }]}
      />
    )
    expect(container.querySelector('source[src="/clip.webm"]')).not.toBeNull()
    expect(container.querySelector('track[srclang="en"]')).not.toBeNull()
  })

  it('invokes onTimeUpdate with currentTime and duration', () => {
    const onTimeUpdate = vi.fn()
    render(<NativeVideo src="/clip.mp4" alt="TU" onTimeUpdate={onTimeUpdate} />)
    fireEvent.timeUpdate(screen.getByLabelText('TU'))
    expect(onTimeUpdate).toHaveBeenCalledWith(0, 100)
  })

  it('fires onError and onLoadedData handlers', () => {
    const onError = vi.fn()
    const onLoadedData = vi.fn()
    render(<NativeVideo src="/clip.mp4" alt="Errv" onError={onError} onLoadedData={onLoadedData} />)
    const video = screen.getByLabelText('Errv')
    fireEvent.error(video)
    fireEvent.loadedData(video)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onLoadedData).toHaveBeenCalledTimes(1)
  })

  it('fires onPlay/onPause/onEnded handlers', () => {
    const onPlay = vi.fn()
    const onPause = vi.fn()
    const onEnded = vi.fn()
    render(
      <NativeVideo src="/clip.mp4" alt="Cb" onPlay={onPlay} onPause={onPause} onEnded={onEnded} />
    )
    const video = screen.getByLabelText('Cb')
    fireEvent.play(video)
    fireEvent.pause(video)
    fireEvent.ended(video)
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onEnded).toHaveBeenCalledTimes(1)
  })
})

describe('GifPlayer', () => {
  // NOTE: core useReducedMotion() defaults to `true` on the first commit, so the
  // GifPlayer's reduced-motion effect pauses an autoplay gif on mount even though
  // matchMedia later reports no-preference. Tests assert this real behavior:
  // after mount, an autoplay gif is paused and shows the poster.
  it('renders an img and starts paused under default reduced-motion (shows poster)', () => {
    render(<GifPlayer src="/anim.gif" alt="Loading bar" poster="/static.png" autoplay />)
    const img = screen.getByAltText('Loading bar') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/static.png')
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles play/pause on click, swapping between gif and poster src', () => {
    render(<GifPlayer src="/anim.gif" alt="Toggle me" poster="/static.png" autoplay />)
    const img = screen.getByAltText('Toggle me') as HTMLImageElement
    const button = screen.getByRole('button')
    // Starts paused (poster) due to default reduced-motion
    expect(img.getAttribute('src')).toBe('/static.png')
    // Click → play → gif
    fireEvent.click(button)
    expect(img.getAttribute('src')).toBe('/anim.gif')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    // Click → pause → poster
    fireEvent.click(button)
    expect(img.getAttribute('src')).toBe('/static.png')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('exposes an accessible play/pause label reflecting current state', () => {
    render(<GifPlayer src="/anim.gif" alt="A11y gif" poster="/static.png" autoplay />)
    const button = screen.getByRole('button')
    // Paused on mount → "Play"
    expect(button.getAttribute('aria-label')).toBe('Play A11y gif')
    fireEvent.click(button)
    // Now playing → "Pause"
    expect(button.getAttribute('aria-label')).toBe('Pause A11y gif')
  })

  it('fires onLoad when the underlying img loads', () => {
    const onLoad = vi.fn()
    render(<GifPlayer src="/anim.gif" alt="Load gif" onLoad={onLoad} />)
    fireEvent.load(screen.getByAltText('Load gif'))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('falls back to gif src when no poster is provided and paused', () => {
    // displaySrc = isPlaying ? src : (poster ?? src); no poster → always gif src
    render(<GifPlayer src="/anim.gif" alt="No poster" autoplay />)
    expect((screen.getByAltText('No poster') as HTMLImageElement).getAttribute('src')).toBe(
      '/anim.gif'
    )
  })
})
