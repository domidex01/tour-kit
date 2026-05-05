import { describe, expect, it } from 'vitest'
import { type ResolvedMediaSlotType, detectMediaSlotType } from './detect-media-type'

describe('detectMediaSlotType', () => {
  it.each<[string, ResolvedMediaSlotType]>([
    // YouTube
    ['https://youtu.be/abc', 'youtube'],
    ['https://www.youtube.com/watch?v=abc', 'youtube'],
    ['https://YouTube.com/embed/x', 'youtube'],
    // Vimeo
    ['https://vimeo.com/123', 'vimeo'],
    // Loom — must match before wistia per PATTERNS order
    ['https://loom.com/share/abc', 'loom'],
    // Wistia
    ['https://wistia.com/medias/abc', 'wistia'],
    ['https://wi.st/medias/abc', 'wistia'],
    // Native video (mp4/webm/mov)
    ['/video.mp4', 'video'],
    ['/clip.webm?token=x', 'video'],
    ['/clip.mov', 'video'],
    // GIF
    ['/animation.gif', 'gif'],
    ['/animation.gif?v=2', 'gif'],
    // Lottie
    ['https://lottiefiles.com/abc', 'lottie'],
    ['/anim.lottie', 'lottie'],
    // Unknown fallback → image
    ['https://example.com/unknown', 'image'],
    ['https://my-cdn.example/path/file', 'image'],
    ['', 'image'],
    ['not-a-url', 'image'],
  ])('detects %s → %s', (src, expected) => {
    expect(detectMediaSlotType(src)).toBe(expected)
  })

  it('PATTERNS order: loom resolves to loom (not wistia) — regression guard', () => {
    expect(detectMediaSlotType('https://loom.com/share/abc')).toBe('loom')
  })

  it('case-insensitive matching for platform URLs', () => {
    expect(detectMediaSlotType('https://VIMEO.COM/123')).toBe('vimeo')
    expect(detectMediaSlotType('/CLIP.MP4')).toBe('video')
  })
})
