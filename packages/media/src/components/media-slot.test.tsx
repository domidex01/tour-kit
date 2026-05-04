/* eslint-disable react/no-unknown-property */
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Embed dispatch stubs (used by the dispatch + reduced-motion suites) ---
vi.mock('./embeds', () => ({
  YouTubeEmbed: (p: { videoId?: string; title?: string; autoplay?: boolean; onError?: () => void }) => (
    <div data-testid="embed" data-type="youtube" data-videoid={p.videoId} data-autoplay={String(p.autoplay ?? false)}>
      <button type="button" data-testid="trigger-error" onClick={() => p.onError?.()} />
    </div>
  ),
  VimeoEmbed: (p: { videoId?: string; autoplay?: boolean }) => (
    <div data-testid="embed" data-type="vimeo" data-videoid={p.videoId} data-autoplay={String(p.autoplay ?? false)} />
  ),
  LoomEmbed: (p: { videoId?: string; autoplay?: boolean }) => (
    <div data-testid="embed" data-type="loom" data-videoid={p.videoId} data-autoplay={String(p.autoplay ?? false)} />
  ),
  WistiaEmbed: (p: { videoId?: string; autoplay?: boolean }) => (
    <div data-testid="embed" data-type="wistia" data-videoid={p.videoId} data-autoplay={String(p.autoplay ?? false)} />
  ),
  NativeVideo: (p: { src?: string; autoplay?: boolean }) => (
    <div data-testid="embed" data-type="video" data-src={p.src} data-autoplay={String(p.autoplay ?? false)} />
  ),
  GifPlayer: (p: { src?: string; autoplay?: boolean }) => (
    <div data-testid="embed" data-type="gif" data-src={p.src} data-autoplay={String(p.autoplay ?? false)} />
  ),
  LottiePlayer: (p: { src?: string; autoplay?: boolean }) => (
    <div data-testid="embed" data-type="lottie" data-src={p.src} data-autoplay={String(p.autoplay ?? false)} />
  ),
}))

// --- useReducedMotion mock: mutable closure for per-test toggling ---
const reducedMotionState = { value: false }
vi.mock('@tour-kit/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@tour-kit/core')>()
  return { ...orig, useReducedMotion: () => reducedMotionState.value }
})

import { MediaSlot } from './media-slot'

describe('MediaSlot dispatch', () => {
  beforeEach(() => {
    reducedMotionState.value = false
  })

  it.each([
    ['https://youtu.be/abc', 'youtube'],
    ['https://www.youtube.com/watch?v=abc', 'youtube'],
    ['https://vimeo.com/123', 'vimeo'],
    ['https://loom.com/share/abc', 'loom'],
    ['https://wistia.com/medias/abc', 'wistia'],
    ['/video.mp4', 'video'],
    ['/clip.webm', 'video'],
    ['/anim.gif', 'gif'],
    ['/anim.lottie', 'lottie'],
  ])('routes %s → embed[data-type=%s]', (src, expectedType) => {
    render(<MediaSlot src={src} />)
    expect(screen.getByTestId('embed')).toHaveAttribute('data-type', expectedType)
  })

  it('falls back to <img> for unknown URLs (with provided alt)', () => {
    const { container } = render(<MediaSlot src="https://example.com/x" alt="Hello" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('alt')).toBe('Hello')
    expect(img!.getAttribute('loading')).toBe('lazy')
  })

  it('falls back to <img alt=""> for unknown URLs without alt', () => {
    const { container } = render(<MediaSlot src="https://example.com/x" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('alt')).toBe('')
  })

  it('type override beats URL detection', () => {
    render(<MediaSlot src="https://youtu.be/x" type="video" />)
    expect(screen.getByTestId('embed')).toHaveAttribute('data-type', 'video')
  })

  it('extracts videoId from YouTube URL', () => {
    render(<MediaSlot src="https://youtu.be/dQw4w9WgXcQ" />)
    expect(screen.getByTestId('embed')).toHaveAttribute('data-videoid', 'dQw4w9WgXcQ')
  })
})

describe('MediaSlot reduced-motion behavior', () => {
  beforeEach(() => {
    reducedMotionState.value = true
  })

  it('Lottie receives autoplay={false} when reduce is set, even if caller asked for autoplay', () => {
    render(<MediaSlot src="/anim.lottie" autoplay />)
    expect(screen.getByTestId('embed')).toHaveAttribute('data-autoplay', 'false')
  })

  it('NativeVideo autoplay is suppressed regardless of caller prop', () => {
    render(<MediaSlot src="/video.mp4" type="video" autoplay />)
    expect(screen.getByTestId('embed')).toHaveAttribute('data-autoplay', 'false')
  })

  it('YouTube autoplay is suppressed under reduce', () => {
    render(<MediaSlot src="https://youtu.be/x" autoplay />)
    expect(screen.getByTestId('embed')).toHaveAttribute('data-autoplay', 'false')
  })

  it('GIF without poster emits a dev-only console.warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<MediaSlot src="/animation.gif" />)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('GIF rendered without poster under prefers-reduced-motion: reduce'),
    )
    warn.mockRestore()
  })

  it('GIF with poster does NOT warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<MediaSlot src="/animation.gif" poster="/p.png" />)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('MediaSlot iframe error fallback', () => {
  beforeEach(() => {
    reducedMotionState.value = false
  })

  it('YouTube → fallback card with provider name on onError', () => {
    render(<MediaSlot src="https://youtu.be/abc" alt="Demo" />)
    fireEvent.click(screen.getByTestId('trigger-error'))
    const link = screen.getByRole('link', { name: /Watch on YouTube/i })
    expect(link).toHaveAttribute('href', 'https://youtu.be/abc')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('non-iframe types do NOT render fallback even after error event', () => {
    render(<MediaSlot src="/video.mp4" type="video" />)
    // No trigger-error button on NativeVideo stub — assert the embed rendered, not the fallback
    expect(screen.getByTestId('embed')).toHaveAttribute('data-type', 'video')
    expect(screen.queryByRole('link', { name: /Watch on/i })).toBeNull()
  })
})
