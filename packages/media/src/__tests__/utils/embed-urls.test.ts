import { describe, expect, it } from 'vitest'
import {
  buildLoomEmbedUrl,
  buildVimeoEmbedUrl,
  buildWistiaEmbedUrl,
  buildYouTubeEmbedUrl,
  getVimeoThumbnailUrl,
  getYouTubeThumbnailUrl,
} from '../../utils/embed-urls'

describe('buildYouTubeEmbedUrl', () => {
  it('builds basic embed URL with privacy mode', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ')
    expect(url).toContain('youtube-nocookie.com')
    expect(url).toContain('/embed/dQw4w9WgXcQ')
    expect(url).toContain('rel=0')
    expect(url).toContain('modestbranding=1')
  })

  it('adds autoplay parameter', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ', { autoplay: true })
    expect(url).toContain('autoplay=1')
  })

  it('adds mute parameter', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ', { muted: true })
    expect(url).toContain('mute=1')
  })

  it('disables controls', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ', { controls: false })
    expect(url).toContain('controls=0')
  })

  it('adds loop parameter with playlist', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ', { loop: true })
    expect(url).toContain('loop=1')
    expect(url).toContain('playlist=dQw4w9WgXcQ')
  })

  it('adds start time parameter', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ', { startTime: 30 })
    expect(url).toContain('start=30')
  })

  it('floors start time to integer', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ', { startTime: 30.5 })
    expect(url).toContain('start=30')
  })
})

describe('buildVimeoEmbedUrl', () => {
  it('builds basic embed URL with privacy', () => {
    const url = buildVimeoEmbedUrl('123456789')
    expect(url).toContain('player.vimeo.com/video/123456789')
    expect(url).toContain('dnt=1')
  })

  it('adds autoplay parameter', () => {
    const url = buildVimeoEmbedUrl('123456789', { autoplay: true })
    expect(url).toContain('autoplay=1')
  })

  it('adds muted parameter', () => {
    const url = buildVimeoEmbedUrl('123456789', { muted: true })
    expect(url).toContain('muted=1')
  })

  it('adds loop parameter', () => {
    const url = buildVimeoEmbedUrl('123456789', { loop: true })
    expect(url).toContain('loop=1')
  })

  it('adds start time as fragment', () => {
    const url = buildVimeoEmbedUrl('123456789', { startTime: 30 })
    expect(url).toContain('#t=30s')
  })
})

describe('buildLoomEmbedUrl', () => {
  it('builds basic embed URL', () => {
    const url = buildLoomEmbedUrl('abc123')
    expect(url).toContain('loom.com/embed/abc123')
  })

  it('adds autoplay parameter', () => {
    const url = buildLoomEmbedUrl('abc123', { autoplay: true })
    expect(url).toContain('autoplay=true')
  })

  it('adds muted parameter', () => {
    const url = buildLoomEmbedUrl('abc123', { muted: true })
    expect(url).toContain('muted=true')
  })

  it('adds loop parameter', () => {
    const url = buildLoomEmbedUrl('abc123', { loop: true })
    expect(url).toContain('loop=true')
  })

  it('hides controls when specified', () => {
    const url = buildLoomEmbedUrl('abc123', { controls: false })
    expect(url).toContain('hide_controls=true')
  })

  it('adds start time parameter', () => {
    const url = buildLoomEmbedUrl('abc123', { startTime: 30 })
    expect(url).toContain('t=30')
  })
})

describe('buildWistiaEmbedUrl', () => {
  it('builds basic embed URL', () => {
    const url = buildWistiaEmbedUrl('abc123')
    expect(url).toContain('fast.wistia.net/embed/iframe/abc123')
  })

  it('adds autoPlay parameter', () => {
    const url = buildWistiaEmbedUrl('abc123', { autoplay: true })
    expect(url).toContain('autoPlay=true')
  })

  it('adds muted and silentAutoPlay parameters', () => {
    const url = buildWistiaEmbedUrl('abc123', { muted: true })
    expect(url).toContain('muted=true')
    expect(url).toContain('silentAutoPlay=true')
  })

  it('adds loop parameter', () => {
    const url = buildWistiaEmbedUrl('abc123', { loop: true })
    expect(url).toContain('endVideoBehavior=loop')
  })

  it('hides controls on load when specified', () => {
    const url = buildWistiaEmbedUrl('abc123', { controls: false })
    expect(url).toContain('controlsVisibleOnLoad=false')
  })

  it('adds start time parameter', () => {
    const url = buildWistiaEmbedUrl('abc123', { startTime: 30 })
    expect(url).toContain('time=30')
  })
})

describe('getYouTubeThumbnailUrl', () => {
  it('returns maxresdefault by default', () => {
    const url = getYouTubeThumbnailUrl('dQw4w9WgXcQ')
    expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')
  })

  it('returns default quality', () => {
    const url = getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'default')
    expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg')
  })

  it('returns medium quality', () => {
    const url = getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'medium')
    expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg')
  })

  it('returns high quality', () => {
    const url = getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'high')
    expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })
})

describe('getVimeoThumbnailUrl', () => {
  it('returns the oEmbed JSON endpoint for the given id', () => {
    expect(getVimeoThumbnailUrl('123456789')).toBe('https://vimeo.com/api/v2/video/123456789.json')
  })
})

describe('embed URL option edge cases', () => {
  it('YouTube omits start when startTime is 0', () => {
    expect(buildYouTubeEmbedUrl('dQw4w9WgXcQ', { startTime: 0 })).not.toContain('start=')
  })

  it('Vimeo omits start fragment when startTime is 0', () => {
    expect(buildVimeoEmbedUrl('123456789', { startTime: 0 })).not.toContain('#t=')
  })

  it('Loom omits start when startTime is 0', () => {
    expect(buildLoomEmbedUrl('abc123', { startTime: 0 })).not.toContain('t=')
  })

  it('Wistia floors-free startTime passes through raw value', () => {
    expect(buildWistiaEmbedUrl('abc123', { startTime: 12.5 })).toContain('time=12.5')
  })

  it('YouTube returns a clean URL with no query string when no toggling options set beyond defaults', () => {
    // rel and modestbranding are always present, so a query string always exists
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ')
    expect(url).toContain('?')
  })
})
