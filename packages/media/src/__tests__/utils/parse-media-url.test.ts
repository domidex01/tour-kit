import { describe, expect, it } from 'vitest'
import {
  detectMediaType,
  isEmbedType,
  isNativeVideoType,
  isSupportedMediaUrl,
  parseMediaUrl,
} from '../../utils/parse-media-url'

describe('detectMediaType', () => {
  describe('YouTube', () => {
    it('detects youtube.com/watch URLs', () => {
      expect(detectMediaType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube')
    })

    it('detects youtu.be URLs', () => {
      expect(detectMediaType('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
    })

    it('detects youtube.com/embed URLs', () => {
      expect(detectMediaType('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('youtube')
    })

    it('detects youtube-nocookie.com URLs', () => {
      expect(detectMediaType('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('youtube')
    })
  })

  describe('Vimeo', () => {
    it('detects vimeo.com URLs', () => {
      expect(detectMediaType('https://vimeo.com/123456789')).toBe('vimeo')
    })

    it('detects player.vimeo.com URLs', () => {
      expect(detectMediaType('https://player.vimeo.com/video/123456789')).toBe('vimeo')
    })
  })

  describe('Loom', () => {
    it('detects loom.com/share URLs', () => {
      expect(detectMediaType('https://www.loom.com/share/abc123def456')).toBe('loom')
    })

    it('detects loom.com/embed URLs', () => {
      expect(detectMediaType('https://www.loom.com/embed/abc123def456')).toBe('loom')
    })
  })

  describe('Wistia', () => {
    it('detects wistia.com/medias URLs', () => {
      expect(detectMediaType('https://wistia.com/medias/abc123')).toBe('wistia')
    })

    it('detects fast.wistia.net/embed URLs', () => {
      expect(detectMediaType('https://fast.wistia.net/embed/iframe/abc123')).toBe('wistia')
    })
  })

  describe('Native video', () => {
    it('detects .mp4 files', () => {
      expect(detectMediaType('/videos/demo.mp4')).toBe('video')
    })

    it('detects .webm files', () => {
      expect(detectMediaType('/videos/demo.webm')).toBe('video')
    })

    it('detects .ogg files', () => {
      expect(detectMediaType('/videos/demo.ogg')).toBe('video')
    })

    it('detects video URLs with query params', () => {
      expect(detectMediaType('/videos/demo.mp4?v=123')).toBe('video')
    })
  })

  describe('GIF', () => {
    it('detects .gif files', () => {
      expect(detectMediaType('/images/animation.gif')).toBe('gif')
    })

    it('detects GIF URLs with query params', () => {
      expect(detectMediaType('/images/animation.gif?v=123')).toBe('gif')
    })
  })

  describe('Lottie', () => {
    it('detects .json files', () => {
      expect(detectMediaType('/animations/loader.json')).toBe('lottie')
    })

    it('detects .lottie files', () => {
      expect(detectMediaType('/animations/loader.lottie')).toBe('lottie')
    })
  })

  describe('Images', () => {
    it('detects .png files', () => {
      expect(detectMediaType('/images/photo.png')).toBe('image')
    })

    it('detects .jpg files', () => {
      expect(detectMediaType('/images/photo.jpg')).toBe('image')
    })

    it('detects .webp files', () => {
      expect(detectMediaType('/images/photo.webp')).toBe('image')
    })

    it('defaults unknown URLs to image', () => {
      expect(detectMediaType('https://example.com/unknown')).toBe('image')
    })
  })
})

describe('parseMediaUrl', () => {
  it('returns null for empty string', () => {
    expect(parseMediaUrl('')).toBeNull()
  })

  it('parses YouTube URLs correctly', () => {
    const result = parseMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result).toEqual({
      type: 'youtube',
      id: 'dQw4w9WgXcQ',
      embedUrl: expect.stringContaining('youtube-nocookie.com'),
      thumbnailUrl: expect.stringContaining('img.youtube.com'),
    })
  })

  it('parses Vimeo URLs correctly', () => {
    const result = parseMediaUrl('https://vimeo.com/123456789')
    expect(result).toEqual({
      type: 'vimeo',
      id: '123456789',
      embedUrl: expect.stringContaining('player.vimeo.com'),
    })
  })

  it('parses Loom URLs correctly', () => {
    const result = parseMediaUrl('https://www.loom.com/share/abc123')
    expect(result).toEqual({
      type: 'loom',
      id: 'abc123',
      embedUrl: expect.stringContaining('loom.com/embed'),
    })
  })

  it('parses native video URLs correctly', () => {
    const result = parseMediaUrl('/videos/demo.mp4')
    expect(result).toEqual({
      type: 'video',
      id: '/videos/demo.mp4',
      embedUrl: '/videos/demo.mp4',
    })
  })

  it('parses GIF URLs correctly', () => {
    const result = parseMediaUrl('/images/animation.gif')
    expect(result).toEqual({
      type: 'gif',
      id: '/images/animation.gif',
      embedUrl: '/images/animation.gif',
    })
  })
})

describe('isSupportedMediaUrl', () => {
  it('returns true for YouTube URLs', () => {
    expect(isSupportedMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
  })

  it('returns true for video files', () => {
    expect(isSupportedMediaUrl('/video.mp4')).toBe(true)
  })

  it('returns true for image files', () => {
    expect(isSupportedMediaUrl('/image.png')).toBe(true)
  })

  it('returns false for unknown URLs without image extension', () => {
    expect(isSupportedMediaUrl('https://example.com/unknown')).toBe(false)
  })
})

describe('isEmbedType', () => {
  it('returns true for YouTube', () => {
    expect(isEmbedType('youtube')).toBe(true)
  })

  it('returns true for Vimeo', () => {
    expect(isEmbedType('vimeo')).toBe(true)
  })

  it('returns true for Loom', () => {
    expect(isEmbedType('loom')).toBe(true)
  })

  it('returns true for Wistia', () => {
    expect(isEmbedType('wistia')).toBe(true)
  })

  it('returns false for native video', () => {
    expect(isEmbedType('video')).toBe(false)
  })

  it('returns false for GIF', () => {
    expect(isEmbedType('gif')).toBe(false)
  })
})

describe('isNativeVideoType', () => {
  it('returns true for video', () => {
    expect(isNativeVideoType('video')).toBe(true)
  })

  it('returns false for YouTube', () => {
    expect(isNativeVideoType('youtube')).toBe(false)
  })

  it('returns false for GIF', () => {
    expect(isNativeVideoType('gif')).toBe(false)
  })
})
