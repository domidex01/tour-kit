import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  useMediaQuery,
  usePrefersReducedMotion,
  useReducedMotion,
} from '../../hooks/use-media-query'

describe('useMediaQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when query matches', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('returns false when query does not match', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('updates when media query changes', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | undefined

    // `useSyncExternalStore` re-reads `matchMedia(query).matches` (the source of
    // truth) when notified, so the mock must mutate `.matches` the way a real
    // MediaQueryList does before dispatching the change event.
    const mql = {
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn((event: string, handler: unknown) => {
        if (event === 'change') changeHandler = handler as (e: MediaQueryListEvent) => void
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }
    vi.mocked(window.matchMedia).mockReturnValue(mql as unknown as MediaQueryList)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)

    act(() => {
      mql.matches = true
      changeHandler?.({ matches: true } as MediaQueryListEvent)
    })

    expect(result.current).toBe(true)
  })

  it('returns false from the server snapshot (no hydration mismatch)', async () => {
    const React = await import('react')
    const { renderToString } = await import('react-dom/server')

    // Even if matchMedia would report `true`, SSR must use the server snapshot
    // (`false`) so the first client render matches the server markup.
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    function Probe() {
      const matches = useMediaQuery('(min-width: 768px)')
      return React.createElement('span', { 'data-matches': String(matches) })
    }

    const html = renderToString(React.createElement(Probe))
    expect(html).toContain('data-matches="false"')
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn()

    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('usePrefersReducedMotion', () => {
  it('returns true when reduced motion is preferred', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false when motion is preferred', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('queries the correct media query', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    renderHook(() => usePrefersReducedMotion())
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })
})

describe('useReducedMotion (SSR-safe-default-true)', () => {
  it('renderToString returns reduce=true (Comeau pattern)', async () => {
    const React = await import('react')
    const { renderToString } = await import('react-dom/server')

    function Probe() {
      const reduce = useReducedMotion()
      return React.createElement('span', { 'data-reduce': String(reduce) })
    }

    const html = renderToString(React.createElement(Probe))
    expect(html).toContain('data-reduce="true"')
  })

  it('flips to actual matchMedia value after effect (matches=false → reduce=false)', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => useReducedMotion())
    // After effect flush (renderHook flushes effects synchronously), the
    // wrapper has flipped from the SSR default `true` to actual matchMedia.
    expect(result.current).toBe(false)
  })

  it('stays true when matchMedia reports reduce=true', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList)

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('responds to matchMedia change events', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | undefined

    const mql = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn((event: string, handler: unknown) => {
        if (event === 'change') changeHandler = handler as (e: MediaQueryListEvent) => void
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }
    vi.mocked(window.matchMedia).mockReturnValue(mql as unknown as MediaQueryList)

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    act(() => {
      mql.matches = true
      changeHandler?.({ matches: true } as MediaQueryListEvent)
    })

    expect(result.current).toBe(true)
  })
})
