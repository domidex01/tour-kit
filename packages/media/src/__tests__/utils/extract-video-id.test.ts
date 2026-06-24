import { describe, expect, it } from 'vitest'
import {
  extractLoomId,
  extractVimeoId,
  extractWistiaId,
  extractYouTubeId,
  isLoomUrl,
  isVimeoUrl,
  isWistiaUrl,
  isYouTubeUrl,
} from '../../utils/extract-video-id'

describe('extractYouTubeId', () => {
  it('extracts from watch?v= URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts from youtu.be short URLs', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts from /embed/ URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts from /v/ URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts from youtube-nocookie.com/embed URLs', () => {
    expect(extractYouTubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ'
    )
  })

  it('returns null for non-YouTube URLs', () => {
    expect(extractYouTubeId('https://vimeo.com/123456789')).toBeNull()
  })

  it('returns null when the id is the wrong length', () => {
    expect(extractYouTubeId('https://youtu.be/short')).toBeNull()
  })
})

describe('extractVimeoId', () => {
  it('extracts from vimeo.com URLs', () => {
    expect(extractVimeoId('https://vimeo.com/123456789')).toBe('123456789')
  })

  it('extracts from player.vimeo.com/video URLs', () => {
    expect(extractVimeoId('https://player.vimeo.com/video/987654321')).toBe('987654321')
  })

  it('returns null for non-Vimeo URLs', () => {
    expect(extractVimeoId('https://youtu.be/dQw4w9WgXcQ')).toBeNull()
  })
})

describe('extractLoomId', () => {
  it('extracts from loom.com/share URLs', () => {
    expect(extractLoomId('https://www.loom.com/share/abc123def456')).toBe('abc123def456')
  })

  it('extracts from loom.com/embed URLs', () => {
    expect(extractLoomId('https://www.loom.com/embed/xyz789')).toBe('xyz789')
  })

  it('returns null for non-Loom URLs', () => {
    expect(extractLoomId('https://vimeo.com/123456789')).toBeNull()
  })
})

describe('extractWistiaId', () => {
  it('extracts from wistia.com/medias URLs', () => {
    expect(extractWistiaId('https://mybrand.wistia.com/medias/abc123')).toBe('abc123')
  })

  it('extracts from fast.wistia.net/embed/iframe URLs', () => {
    expect(extractWistiaId('https://fast.wistia.net/embed/iframe/def456')).toBe('def456')
  })

  it('extracts from fast.wistia.com/embed/medias URLs', () => {
    expect(extractWistiaId('https://fast.wistia.com/embed/medias/ghi789')).toBe('ghi789')
  })

  it('returns null for non-Wistia URLs', () => {
    expect(extractWistiaId('https://youtu.be/dQw4w9WgXcQ')).toBeNull()
  })
})

describe('platform URL guards', () => {
  it('isYouTubeUrl distinguishes YouTube from others', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(isYouTubeUrl('https://vimeo.com/123456789')).toBe(false)
  })

  it('isVimeoUrl distinguishes Vimeo from others', () => {
    expect(isVimeoUrl('https://player.vimeo.com/video/123456789')).toBe(true)
    expect(isVimeoUrl('https://www.loom.com/share/abc123')).toBe(false)
  })

  it('isLoomUrl distinguishes Loom from others', () => {
    expect(isLoomUrl('https://www.loom.com/embed/abc123')).toBe(true)
    expect(isLoomUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(false)
  })

  it('isWistiaUrl distinguishes Wistia from others', () => {
    expect(isWistiaUrl('https://fast.wistia.net/embed/iframe/abc123')).toBe(true)
    expect(isWistiaUrl('https://vimeo.com/123456789')).toBe(false)
  })
})
