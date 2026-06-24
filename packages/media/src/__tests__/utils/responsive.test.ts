import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ResponsiveSource } from '../../types'
import { getSourceType, selectResponsiveSource } from '../../utils/responsive'

/**
 * Helper to stub window.matchMedia so that only `matchingQuery` reports
 * `matches: true`. Restored after each test via afterEach below.
 */
function stubMatchMedia(matchingQuery: string | null) {
  const spy = vi.fn().mockImplementation((query: string) => ({
    matches: matchingQuery !== null && query === matchingQuery,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  Object.defineProperty(window, 'matchMedia', { writable: true, value: spy })
  return spy
}

describe('selectResponsiveSource', () => {
  afterEach(() => {
    // Restore the default (matches: false) stub from setup.ts
    stubMatchMedia(null)
  })

  it('returns defaultSrc when sources is undefined', () => {
    expect(selectResponsiveSource(undefined, '/default.mp4')).toBe('/default.mp4')
  })

  it('returns defaultSrc when sources is empty', () => {
    expect(selectResponsiveSource([], '/default.mp4')).toBe('/default.mp4')
  })

  it('returns defaultSrc when no source media query matches', () => {
    stubMatchMedia(null) // nothing matches
    const sources: ResponsiveSource[] = [
      { src: '/mobile.mp4', media: '(max-width: 600px)' },
      { src: '/desktop.mp4', media: '(min-width: 1200px)' },
    ]
    expect(selectResponsiveSource(sources, '/default.mp4')).toBe('/default.mp4')
  })

  it('picks the source whose media query matches', () => {
    stubMatchMedia('(max-width: 600px)')
    const sources: ResponsiveSource[] = [
      { src: '/mobile.mp4', media: '(max-width: 600px)' },
      { src: '/desktop.mp4', media: '(min-width: 1200px)' },
    ]
    expect(selectResponsiveSource(sources, '/default.mp4')).toBe('/mobile.mp4')
  })

  it('returns the first matching source when multiple match', () => {
    // matchMedia returns true for every query here
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    const sources: ResponsiveSource[] = [
      { src: '/first.mp4', media: '(max-width: 600px)' },
      { src: '/second.mp4', media: '(min-width: 1200px)' },
    ]
    expect(selectResponsiveSource(sources, '/default.mp4')).toBe('/first.mp4')
  })

  it('skips sources without a media query', () => {
    stubMatchMedia('(min-width: 1200px)')
    const sources: ResponsiveSource[] = [
      { src: '/no-media.mp4' }, // no media → skipped
      { src: '/desktop.mp4', media: '(min-width: 1200px)' },
    ]
    expect(selectResponsiveSource(sources, '/default.mp4')).toBe('/desktop.mp4')
  })
})

describe('getSourceType', () => {
  it('maps .mp4 to video/mp4', () => {
    expect(getSourceType('/clip.mp4')).toBe('video/mp4')
  })

  it('maps .webm to video/webm', () => {
    expect(getSourceType('/clip.webm')).toBe('video/webm')
  })

  it('maps .ogg to video/ogg', () => {
    expect(getSourceType('/clip.ogg')).toBe('video/ogg')
  })

  it('maps .mov to video/quicktime', () => {
    expect(getSourceType('/clip.mov')).toBe('video/quicktime')
  })

  it('maps .m4v to video/x-m4v', () => {
    expect(getSourceType('/clip.m4v')).toBe('video/x-m4v')
  })

  it('is case-insensitive', () => {
    expect(getSourceType('/CLIP.MP4')).toBe('video/mp4')
  })

  it('returns undefined for unknown extensions', () => {
    expect(getSourceType('/clip.txt')).toBeUndefined()
  })

  it('returns undefined when there is no extension', () => {
    expect(getSourceType('/clip')).toBeUndefined()
  })
})
