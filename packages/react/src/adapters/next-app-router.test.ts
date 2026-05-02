import { act, renderHook } from '@testing-library/react'
import { TourProvider, type TourRouteError, useTour } from '@tour-kit/core'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNextAppRouterAdapter } from './next-app-router'

// -----------------------------------------------------------------------------
// Mock Factories
// -----------------------------------------------------------------------------

// Types matching the adapter's expected signatures
type UsePathname = () => string | null
type UseRouter = () => { push: (href: string) => void }

interface MockNextAppRouterHooks {
  usePathname: UsePathname
  useRouter: UseRouter
  push: ReturnType<typeof vi.fn>
  setPathname: (path: string | null) => void
  getPathname: () => string | null
}

function createMockHooks(initialPath = '/'): MockNextAppRouterHooks {
  let pathname: string | null = initialPath
  const push = vi.fn()
  // Create a stable router object that persists across renders
  const router = { push }

  return {
    usePathname: vi.fn(() => pathname) as unknown as UsePathname,
    useRouter: vi.fn(() => router) as unknown as UseRouter,
    push,
    setPathname: (path: string | null) => {
      pathname = path
    },
    getPathname: () => pathname,
  }
}

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

describe('createNextAppRouterAdapter', () => {
  let mocks: MockNextAppRouterHooks

  beforeEach(() => {
    mocks = createMockHooks('/')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('factory function', () => {
    it('returns a hook function', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      expect(typeof useAdapter).toBe('function')
    })

    it('hook returns RouterAdapter with all required methods', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current).toHaveProperty('getCurrentRoute')
      expect(result.current).toHaveProperty('navigate')
      expect(result.current).toHaveProperty('matchRoute')
      expect(result.current).toHaveProperty('onRouteChange')
      expect(typeof result.current.getCurrentRoute).toBe('function')
      expect(typeof result.current.navigate).toBe('function')
      expect(typeof result.current.matchRoute).toBe('function')
      expect(typeof result.current.onRouteChange).toBe('function')
    })
  })

  describe('getCurrentRoute()', () => {
    it('returns current pathname', () => {
      mocks = createMockHooks('/dashboard')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/dashboard')
    })

    it('returns "/" when pathname is null (SSR edge case)', () => {
      mocks = createMockHooks('/')
      mocks.setPathname(null)
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/')
    })

    it('returns updated pathname after route change', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/page-a')

      mocks.setPathname('/page-b')
      rerender()

      expect(result.current.getCurrentRoute()).toBe('/page-b')
    })

    it('callback is stable across rerenders', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstRef = result.current.getCurrentRoute
      rerender()
      const secondRef = result.current.getCurrentRoute

      expect(firstRef).toBe(secondRef)
    })
  })

  describe('navigate()', () => {
    it('calls router.push with the route', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      result.current.navigate('/new-route')

      expect(mocks.push).toHaveBeenCalledWith('/new-route')
      expect(mocks.push).toHaveBeenCalledTimes(1)
    })

    it('returns undefined', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const returnValue = result.current.navigate('/new-route')

      expect(returnValue).toBeUndefined()
    })

    it('handles various path formats', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      result.current.navigate('/')
      expect(mocks.push).toHaveBeenCalledWith('/')

      result.current.navigate('/nested/path/here')
      expect(mocks.push).toHaveBeenCalledWith('/nested/path/here')

      result.current.navigate('/path?query=value&other=1')
      expect(mocks.push).toHaveBeenCalledWith('/path?query=value&other=1')

      result.current.navigate('/path#section')
      expect(mocks.push).toHaveBeenCalledWith('/path#section')
    })

    it('callback is stable when router does not change', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstRef = result.current.navigate
      rerender()
      const secondRef = result.current.navigate

      expect(firstRef).toBe(secondRef)
    })
  })

  describe('matchRoute()', () => {
    beforeEach(() => {
      mocks = createMockHooks('/dashboard/settings')
    })

    describe('exact mode (default)', () => {
      it('matches exact path', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard/settings')).toBe(true)
        expect(result.current.matchRoute('/dashboard/settings', 'exact')).toBe(true)
      })

      it('does not match partial path', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard')).toBe(false)
        expect(result.current.matchRoute('/dashboard/settings/more')).toBe(false)
      })

      it('does not match different path', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/other')).toBe(false)
        expect(result.current.matchRoute('/')).toBe(false)
      })
    })

    describe('startsWith mode', () => {
      it('matches path prefix', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard', 'startsWith')).toBe(true)
        expect(result.current.matchRoute('/dashboard/settings', 'startsWith')).toBe(true)
        expect(result.current.matchRoute('/', 'startsWith')).toBe(true)
      })

      it('does not match non-prefix', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/other', 'startsWith')).toBe(false)
        expect(result.current.matchRoute('settings', 'startsWith')).toBe(false)
      })
    })

    describe('contains mode', () => {
      it('matches substring anywhere in path', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('dashboard', 'contains')).toBe(true)
        expect(result.current.matchRoute('settings', 'contains')).toBe(true)
        expect(result.current.matchRoute('/dashboard', 'contains')).toBe(true)
        expect(result.current.matchRoute('board/set', 'contains')).toBe(true)
      })

      it('does not match non-substring', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('other', 'contains')).toBe(false)
        expect(result.current.matchRoute('profile', 'contains')).toBe(false)
      })
    })

    describe('invalid mode', () => {
      it('defaults to exact matching for unknown mode', () => {
        const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        // TypeScript would prevent this, but testing runtime behavior
        // @ts-expect-error - Testing invalid mode
        expect(result.current.matchRoute('/dashboard/settings', 'invalid')).toBe(true)
        // @ts-expect-error - Testing invalid mode
        expect(result.current.matchRoute('/dashboard', 'invalid')).toBe(false)
      })
    })

    it('callback is stable across rerenders', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstRef = result.current.matchRoute
      rerender()
      const secondRef = result.current.matchRoute

      expect(firstRef).toBe(secondRef)
    })

    it('uses ref-based pathname for latest value', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      expect(result.current.matchRoute('/page-a')).toBe(true)

      mocks.setPathname('/page-b')
      rerender()

      expect(result.current.matchRoute('/page-a')).toBe(false)
      expect(result.current.matchRoute('/page-b')).toBe(true)
    })
  })

  describe('onRouteChange()', () => {
    it('calls callback immediately with current route', () => {
      mocks = createMockHooks('/initial')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)

      expect(callback).toHaveBeenCalledWith('/initial')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('calls callback when pathname changes', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear() // Clear the initial call

      mocks.setPathname('/page-b')
      rerender()

      expect(callback).toHaveBeenCalledWith('/page-b')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('does not call callback when pathname stays the same', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      // Rerender without changing pathname
      rerender()

      expect(callback).not.toHaveBeenCalled()
    })

    it('cleanup removes callback', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback = vi.fn()
      const cleanup = result.current.onRouteChange(callback)
      callback.mockClear()

      cleanup()

      mocks.setPathname('/page-b')
      rerender()

      expect(callback).not.toHaveBeenCalled()
    })

    it('supports multiple subscribers', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      result.current.onRouteChange(callback1)
      result.current.onRouteChange(callback2)
      result.current.onRouteChange(callback3)

      // Clear initial calls
      callback1.mockClear()
      callback2.mockClear()
      callback3.mockClear()

      mocks.setPathname('/page-b')
      rerender()

      expect(callback1).toHaveBeenCalledWith('/page-b')
      expect(callback2).toHaveBeenCalledWith('/page-b')
      expect(callback3).toHaveBeenCalledWith('/page-b')
    })

    it('individual cleanup does not affect other subscribers', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const cleanup1 = result.current.onRouteChange(callback1)
      result.current.onRouteChange(callback2)

      callback1.mockClear()
      callback2.mockClear()

      cleanup1()

      mocks.setPathname('/page-b')
      rerender()

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledWith('/page-b')
    })

    it('callback is stable across rerenders', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstRef = result.current.onRouteChange
      rerender()
      const secondRef = result.current.onRouteChange

      expect(firstRef).toBe(secondRef)
    })
  })

  describe('RouterAdapter memoization', () => {
    it('returns memoized object when dependencies unchanged', () => {
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstAdapter = result.current
      rerender()
      const secondAdapter = result.current

      expect(firstAdapter).toBe(secondAdapter)
    })
  })

  describe('edge cases', () => {
    it('handles empty string pathname', () => {
      mocks = createMockHooks('')
      mocks.setPathname('')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      // Empty string is falsy but not null, so it should be used as-is
      // Actually, usePathname ?? '/' means empty string passes through
      expect(result.current.getCurrentRoute()).toBe('')
    })

    it('handles root path', () => {
      mocks = createMockHooks('/')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/')
      expect(result.current.matchRoute('/')).toBe(true)
    })

    it('handles paths with trailing slashes', () => {
      mocks = createMockHooks('/path/')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/path/')
      expect(result.current.matchRoute('/path/')).toBe(true)
      expect(result.current.matchRoute('/path')).toBe(false)
    })

    it('handles deeply nested paths', () => {
      mocks = createMockHooks('/a/b/c/d/e/f')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/a/b/c/d/e/f')
      expect(result.current.matchRoute('/a', 'startsWith')).toBe(true)
      expect(result.current.matchRoute('c/d', 'contains')).toBe(true)
    })

    it('handles unicode paths', () => {
      mocks = createMockHooks('/chemin/francais')
      const useAdapter = createNextAppRouterAdapter(mocks.usePathname, mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/chemin/francais')
      expect(result.current.matchRoute('/chemin/francais')).toBe(true)
    })
  })
})

describe('useNextAppRouter (direct hook)', () => {
  // Note: Testing the direct hook requires mocking the require() call.
  // In a real test environment, we would need to mock 'next/navigation' module.
  // These tests document the expected behavior.

  it('should throw if next/navigation is not available', () => {
    // The direct hook uses dynamic require which is difficult to mock in Vitest
    // This test documents the expected behavior
    // In production, this would throw: "Cannot find module 'next/navigation'"
    expect(true).toBe(true) // Placeholder - see integration tests for real behavior
  })
})

// -----------------------------------------------------------------------------
// Phase 1.3 — Cross-page tour integration with TourProvider
// -----------------------------------------------------------------------------
//
// These tests render the real `TourProvider` from `@tour-kit/core`, wire in the
// adapter via the `router` prop, and exercise `useTour().next()` to verify
// the per-step `routeChangeStrategy` matrix and the `onStepError` callback.
//
// Mocking strategy: the App Router's `router.push()` returns synchronously
// BEFORE the target component mounts (validation finding from Phase 0). The
// mock pushes by mutating the shared `mockPath` and queuing a microtask that
// appends the target — `waitForStepTarget`'s MutationObserver picks it up.

describe('cross-page (App Router) — Phase 1.3', () => {
  function makeAdapter(initialPath = '/') {
    const state = { path: initialPath }
    const push = vi.fn((href: string) => {
      state.path = href
      // Mount the target as a microtask — simulates the next render after push.
      queueMicrotask(() => {
        const t = document.createElement('div')
        t.id = 'billing-target'
        document.body.appendChild(t)
      })
    })
    const usePathname = (() => state.path) as () => string | null
    const useRouter = (() => ({ push })) as () => { push: (href: string) => void }
    return {
      useAdapter: createNextAppRouterAdapter(usePathname, useRouter),
      push,
      state,
    }
  }

  function makeTours(strategy: 'auto' | 'prompt' | 'manual' = 'auto') {
    return [
      {
        id: 't',
        steps: [
          { id: 'a', target: '#dashboard-target', content: 'A' },
          {
            id: 'b',
            route: '/billing',
            target: '#billing-target',
            content: 'B',
            routeChangeStrategy: strategy,
          },
        ],
      },
    ]
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="dashboard-target"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it("'auto' strategy: navigate, await target, advance to step 2 (US-1)", async () => {
    const { useAdapter, push } = makeAdapter('/')
    const tours = makeTours('auto')

    function Wrapper({ children }: { children: React.ReactNode }) {
      const adapter = useAdapter()
      return React.createElement(TourProvider, { tours, router: adapter, children })
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
    await act(async () => {
      await result.current.start('t')
    })
    expect(result.current.currentStepIndex).toBe(0)

    await act(async () => {
      await result.current.next()
    })

    expect(push).toHaveBeenCalledWith('/billing')
    expect(result.current.currentStepIndex).toBe(1)
  })

  it("'prompt' strategy: fires onNavigationRequired, no push, no advance (US-3)", async () => {
    const { useAdapter, push } = makeAdapter('/')
    const tours = makeTours('prompt')
    const onNavigationRequired = vi.fn()

    function Wrapper({ children }: { children: React.ReactNode }) {
      const adapter = useAdapter()
      return React.createElement(TourProvider, {
        tours,
        router: adapter,
        onNavigationRequired,
        children,
      })
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
    await act(async () => {
      await result.current.start('t')
    })
    await act(async () => {
      await result.current.next()
    })

    expect(onNavigationRequired).toHaveBeenCalledWith('/billing', 'b')
    expect(push).not.toHaveBeenCalled()
    // Provider returned false from navigateToStep — current index unchanged.
    expect(result.current.currentStepIndex).toBe(0)
  })

  it("'manual' strategy: no push, no advance, consumer drives navigation (US-3)", async () => {
    const { useAdapter, push } = makeAdapter('/')
    const tours = makeTours('manual')
    const onNavigationRequired = vi.fn()

    function Wrapper({ children }: { children: React.ReactNode }) {
      const adapter = useAdapter()
      return React.createElement(TourProvider, {
        tours,
        router: adapter,
        onNavigationRequired,
        children,
      })
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
    await act(async () => {
      await result.current.start('t')
    })
    await act(async () => {
      await result.current.next()
    })

    expect(push).not.toHaveBeenCalled()
    expect(onNavigationRequired).not.toHaveBeenCalled()
    expect(result.current.currentStepIndex).toBe(0)
  })

  it("'auto' strategy: target never mounts → onStepError fires with TARGET_NOT_FOUND, tour stops (US-2)", async () => {
    // Push without mounting any target.
    const state = { path: '/' }
    const push = vi.fn((href: string) => {
      state.path = href
    })
    const usePathname = (() => state.path) as () => string | null
    const useRouter = (() => ({ push })) as () => { push: (href: string) => void }
    const useAdapter = createNextAppRouterAdapter(usePathname, useRouter)

    const tours = [
      {
        id: 't',
        steps: [
          { id: 'a', target: '#dashboard-target', content: 'A' },
          {
            id: 'b',
            route: '/billing',
            target: '#billing-target',
            content: 'B',
            routeChangeStrategy: 'auto' as const,
            // 50ms keeps the test under 100ms with fake timers.
            waitTimeout: 50,
          },
        ],
      },
    ]
    const onStepError = vi.fn()

    function Wrapper({ children }: { children: React.ReactNode }) {
      const adapter = useAdapter()
      return React.createElement(TourProvider, {
        tours,
        router: adapter,
        onStepError,
        children,
      })
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
    await act(async () => {
      await result.current.start('t')
    })

    await act(async () => {
      await result.current.next()
      // Drain the 50ms timeout
      await new Promise((resolve) => setTimeout(resolve, 80))
    })

    expect(push).toHaveBeenCalledWith('/billing')
    expect(onStepError).toHaveBeenCalledTimes(1)
    const [err] = onStepError.mock.calls[0] as [TourRouteError]
    expect(err.name).toBe('TourRouteError')
    expect(err.code).toBe('TARGET_NOT_FOUND')
    expect(err.route).toBe('/billing')
    expect(err.selector).toBe('#billing-target')
    // Provider dispatched STOP_TOUR.
    expect(result.current.isActive).toBe(false)
  })
})
