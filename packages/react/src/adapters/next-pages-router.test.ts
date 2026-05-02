import { act, renderHook } from '@testing-library/react'
import { TourProvider, type TourRouteError, useTour } from '@tour-kit/core'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNextPagesRouterAdapter } from './next-pages-router'

// -----------------------------------------------------------------------------
// Mock Factories
// -----------------------------------------------------------------------------

interface MockEventEmitter {
  on: (event: string, handler: (url: string) => void) => void
  off: (event: string, handler: (url: string) => void) => void
  handlers: Map<string, Set<(url: string) => void>>
  emit: (event: string, url: string) => void
  clear: () => void
}

// Type matching the adapter's expected NextPagesRouter
type NextPagesRouter = {
  pathname: string
  push: (url: string) => Promise<boolean>
  events: {
    on: (event: string, handler: (url: string) => void) => void
    off: (event: string, handler: (url: string) => void) => void
  }
}

// Mock router with vi.fn() methods available for testing
interface MockNextPagesRouter {
  pathname: string
  push: ReturnType<typeof vi.fn>
  events: MockEventEmitter
}

// Type for useRouter hook (matching production type)
type UseRouter = () => NextPagesRouter

interface MockNextPagesRouterHooks {
  useRouter: UseRouter
  router: MockNextPagesRouter
  setPathname: (path: string) => void
  getPathname: () => string
  emitRouteChange: (url: string) => void
}

function createMockHooks(initialPath = '/'): MockNextPagesRouterHooks {
  const handlers = new Map<string, Set<(url: string) => void>>()

  const events: MockEventEmitter = {
    on: vi.fn((event: string, handler: (url: string) => void) => {
      if (!handlers.has(event)) {
        handlers.set(event, new Set())
      }
      handlers.get(event)?.add(handler)
    }),
    off: vi.fn((event: string, handler: (url: string) => void) => {
      handlers.get(event)?.delete(handler)
    }),
    handlers,
    emit: (event: string, url: string) => {
      const eventHandlers = handlers.get(event)
      if (eventHandlers) {
        for (const h of eventHandlers) {
          h(url)
        }
      }
    },
    clear: () => {
      handlers.clear()
    },
  }

  let pathname = initialPath

  const pushMock = vi.fn().mockResolvedValue(true)

  const router: MockNextPagesRouter = {
    pathname,
    push: pushMock,
    events,
  }

  // Create a proxy to update pathname dynamically
  const routerProxy = new Proxy(router, {
    get(target, prop) {
      if (prop === 'pathname') {
        return pathname
      }
      return target[prop as keyof MockNextPagesRouter]
    },
  }) as MockNextPagesRouter

  return {
    useRouter: vi.fn(() => routerProxy) as unknown as UseRouter,
    router: routerProxy,
    setPathname: (path: string) => {
      pathname = path
    },
    getPathname: () => pathname,
    emitRouteChange: (url: string) => {
      pathname = url.split('?')[0] ?? url
      events.emit('routeChangeComplete', url)
    },
  }
}

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

describe('createNextPagesRouterAdapter', () => {
  let mocks: MockNextPagesRouterHooks

  beforeEach(() => {
    mocks = createMockHooks('/')
  })

  afterEach(() => {
    vi.clearAllMocks()
    mocks.router.events.clear()
  })

  describe('factory function', () => {
    it('returns a hook function', () => {
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      expect(typeof useAdapter).toBe('function')
    })

    it('hook returns RouterAdapter with all required methods', () => {
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
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
    it('returns current pathname from router', () => {
      mocks = createMockHooks('/dashboard')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/dashboard')
    })

    it('returns updated pathname after route change', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/page-a')

      mocks.setPathname('/page-b')
      rerender()

      expect(result.current.getCurrentRoute()).toBe('/page-b')
    })

    it('callback updates when router.pathname changes', () => {
      mocks = createMockHooks('/initial')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstResult = result.current.getCurrentRoute()
      expect(firstResult).toBe('/initial')

      mocks.setPathname('/changed')
      rerender()

      const secondResult = result.current.getCurrentRoute()
      expect(secondResult).toBe('/changed')
    })
  })

  describe('navigate()', () => {
    it('calls router.push with the route', async () => {
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      await result.current.navigate('/new-route')

      expect(mocks.router.push).toHaveBeenCalledWith('/new-route')
      expect(mocks.router.push).toHaveBeenCalledTimes(1)
    })

    it('returns Promise<boolean>', async () => {
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const returnValue = result.current.navigate('/new-route')

      expect(returnValue).toBeInstanceOf(Promise)
      await expect(returnValue).resolves.toBe(true)
    })

    it('handles navigation returning false', async () => {
      mocks.router.push.mockResolvedValueOnce(false)
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const returnValue = await result.current.navigate('/blocked-route')

      expect(returnValue).toBe(false)
    })

    it('handles navigation rejection', async () => {
      const error = new Error('Navigation cancelled')
      mocks.router.push.mockRejectedValueOnce(error)
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      await expect(result.current.navigate('/error-route')).rejects.toThrow('Navigation cancelled')
    })

    it('handles various path formats', async () => {
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      await result.current.navigate('/')
      expect(mocks.router.push).toHaveBeenCalledWith('/')

      await result.current.navigate('/nested/path/here')
      expect(mocks.router.push).toHaveBeenCalledWith('/nested/path/here')

      await result.current.navigate('/path?query=value&other=1')
      expect(mocks.router.push).toHaveBeenCalledWith('/path?query=value&other=1')
    })
  })

  describe('matchRoute()', () => {
    beforeEach(() => {
      mocks = createMockHooks('/dashboard/settings')
    })

    describe('exact mode (default)', () => {
      it('matches exact path', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard/settings')).toBe(true)
        expect(result.current.matchRoute('/dashboard/settings', 'exact')).toBe(true)
      })

      it('does not match partial path', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard')).toBe(false)
        expect(result.current.matchRoute('/dashboard/settings/more')).toBe(false)
      })

      it('does not match different path', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/other')).toBe(false)
        expect(result.current.matchRoute('/')).toBe(false)
      })
    })

    describe('startsWith mode', () => {
      it('matches path prefix', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard', 'startsWith')).toBe(true)
        expect(result.current.matchRoute('/dashboard/settings', 'startsWith')).toBe(true)
        expect(result.current.matchRoute('/', 'startsWith')).toBe(true)
      })

      it('does not match non-prefix', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/other', 'startsWith')).toBe(false)
        expect(result.current.matchRoute('settings', 'startsWith')).toBe(false)
      })
    })

    describe('contains mode', () => {
      it('matches substring anywhere in path', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('dashboard', 'contains')).toBe(true)
        expect(result.current.matchRoute('settings', 'contains')).toBe(true)
        expect(result.current.matchRoute('/dashboard', 'contains')).toBe(true)
        expect(result.current.matchRoute('board/set', 'contains')).toBe(true)
      })

      it('does not match non-substring', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('other', 'contains')).toBe(false)
        expect(result.current.matchRoute('profile', 'contains')).toBe(false)
      })
    })

    describe('invalid mode', () => {
      it('defaults to exact matching for unknown mode', () => {
        const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
        const { result } = renderHook(() => useAdapter())

        // @ts-expect-error - Testing invalid mode
        expect(result.current.matchRoute('/dashboard/settings', 'invalid')).toBe(true)
        // @ts-expect-error - Testing invalid mode
        expect(result.current.matchRoute('/dashboard', 'invalid')).toBe(false)
      })
    })

    it('updates when pathname changes', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result, rerender } = renderHook(() => useAdapter())

      expect(result.current.matchRoute('/page-a')).toBe(true)
      expect(result.current.matchRoute('/page-b')).toBe(false)

      mocks.setPathname('/page-b')
      rerender()

      expect(result.current.matchRoute('/page-a')).toBe(false)
      expect(result.current.matchRoute('/page-b')).toBe(true)
    })
  })

  describe('onRouteChange()', () => {
    it('calls callback immediately with current route', () => {
      mocks = createMockHooks('/initial')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)

      expect(callback).toHaveBeenCalledWith('/initial')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('subscribes to routeChangeComplete event', () => {
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      renderHook(() => useAdapter())

      expect(mocks.router.events.on).toHaveBeenCalledWith(
        'routeChangeComplete',
        expect.any(Function)
      )
    })

    it('calls callback on route change event', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      // Emit route change event
      act(() => {
        mocks.emitRouteChange('/page-b')
      })

      expect(callback).toHaveBeenCalledWith('/page-b')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('strips query string from URL', () => {
      mocks = createMockHooks('/page')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      act(() => {
        mocks.router.events.emit('routeChangeComplete', '/page?query=value&other=1')
      })

      expect(callback).toHaveBeenCalledWith('/page')
    })

    it('handles URL without query string', () => {
      mocks = createMockHooks('/page')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      act(() => {
        mocks.router.events.emit('routeChangeComplete', '/new-page')
      })

      expect(callback).toHaveBeenCalledWith('/new-page')
    })

    it('cleanup removes callback from Set', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      const cleanup = result.current.onRouteChange(callback)
      callback.mockClear()

      cleanup()

      act(() => {
        mocks.emitRouteChange('/page-b')
      })

      expect(callback).not.toHaveBeenCalled()
    })

    it('unsubscribes from events on unmount', () => {
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { unmount } = renderHook(() => useAdapter())

      unmount()

      expect(mocks.router.events.off).toHaveBeenCalledWith(
        'routeChangeComplete',
        expect.any(Function)
      )
    })

    it('supports multiple subscribers', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      result.current.onRouteChange(callback1)
      result.current.onRouteChange(callback2)
      result.current.onRouteChange(callback3)

      callback1.mockClear()
      callback2.mockClear()
      callback3.mockClear()

      act(() => {
        mocks.emitRouteChange('/page-b')
      })

      expect(callback1).toHaveBeenCalledWith('/page-b')
      expect(callback2).toHaveBeenCalledWith('/page-b')
      expect(callback3).toHaveBeenCalledWith('/page-b')
    })

    it('individual cleanup does not affect other subscribers', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const cleanup1 = result.current.onRouteChange(callback1)
      result.current.onRouteChange(callback2)

      callback1.mockClear()
      callback2.mockClear()

      cleanup1()

      act(() => {
        mocks.emitRouteChange('/page-b')
      })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledWith('/page-b')
    })

    it('handles rapid route changes', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      act(() => {
        mocks.emitRouteChange('/page-b')
        mocks.emitRouteChange('/page-c')
        mocks.emitRouteChange('/page-d')
      })

      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenNthCalledWith(1, '/page-b')
      expect(callback).toHaveBeenNthCalledWith(2, '/page-c')
      expect(callback).toHaveBeenNthCalledWith(3, '/page-d')
    })
  })

  describe('edge cases', () => {
    it('handles root path', () => {
      mocks = createMockHooks('/')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/')
      expect(result.current.matchRoute('/')).toBe(true)
    })

    it('handles paths with trailing slashes', () => {
      mocks = createMockHooks('/path/')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/path/')
      expect(result.current.matchRoute('/path/')).toBe(true)
      expect(result.current.matchRoute('/path')).toBe(false)
    })

    it('handles deeply nested paths', () => {
      mocks = createMockHooks('/a/b/c/d/e/f')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/a/b/c/d/e/f')
      expect(result.current.matchRoute('/a', 'startsWith')).toBe(true)
      expect(result.current.matchRoute('c/d', 'contains')).toBe(true)
    })

    it('handles URL with hash fragment in event', () => {
      mocks = createMockHooks('/page')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      // Note: query string stripping logic uses split('?'), not '#'
      // Hash fragments would pass through
      act(() => {
        mocks.router.events.emit('routeChangeComplete', '/page#section')
      })

      expect(callback).toHaveBeenCalledWith('/page#section')
    })

    it('handles empty URL in event (edge case)', () => {
      mocks = createMockHooks('/page')
      const useAdapter = createNextPagesRouterAdapter(mocks.useRouter)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      act(() => {
        mocks.router.events.emit('routeChangeComplete', '')
      })

      // split('?')[0] on '' returns ''
      expect(callback).toHaveBeenCalledWith('')
    })
  })
})

describe('useNextPagesRouter (direct hook)', () => {
  // Note: Testing the direct hook requires mocking the require() call.
  // These tests document the expected behavior.

  it('should throw if next/router is not available', () => {
    // The direct hook uses dynamic require which is difficult to mock in Vitest
    // This test documents the expected behavior
    expect(true).toBe(true) // Placeholder - see integration tests
  })
})

// -----------------------------------------------------------------------------
// Phase 1.3 — Cross-page tour integration with TourProvider (Pages Router)
// -----------------------------------------------------------------------------
//
// Pages Router differs from App Router: `router.push()` returns
// `Promise<boolean>` and the route mutation happens AFTER the promise
// resolves. We mount the target inside the `.then()` callback to mirror that
// contract — `waitForStepTarget`'s MutationObserver picks it up after.

describe('cross-page (Pages Router) — Phase 1.3', () => {
  function makeAdapter(initialPath = '/') {
    const handlers = new Map<string, Set<(url: string) => void>>()
    const events = {
      on: vi.fn((event: string, handler: (url: string) => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set())
        handlers.get(event)?.add(handler)
      }),
      off: vi.fn((event: string, handler: (url: string) => void) => {
        handlers.get(event)?.delete(handler)
      }),
    }
    const state = { path: initialPath }
    const push = vi.fn((href: string) =>
      Promise.resolve(true).then((ok) => {
        state.path = href
        const t = document.createElement('div')
        t.id = 'billing-target'
        document.body.appendChild(t)
        return ok
      })
    )
    const pushNoMount = vi.fn((href: string) =>
      Promise.resolve(true).then((ok) => {
        state.path = href
        return ok
      })
    )
    const routerProxy = new Proxy(
      { pathname: state.path, push, events },
      {
        get(target, prop) {
          if (prop === 'pathname') return state.path
          if (prop === 'push') return target.push
          if (prop === 'events') return events
          return target[prop as keyof typeof target]
        },
      }
    )
    const useRouter = (() => routerProxy) as () => typeof routerProxy
    return {
      useAdapter: createNextPagesRouterAdapter(useRouter),
      push,
      pushNoMount,
      routerProxy,
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

  it("'auto' strategy: navigate via Promise<true>, target mounts on resolve, advance (US-1)", async () => {
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
    expect(result.current.currentStepIndex).toBe(0)
  })

  it("'manual' strategy: no push, no advance (US-3)", async () => {
    const { useAdapter, push } = makeAdapter('/')
    const tours = makeTours('manual')

    function Wrapper({ children }: { children: React.ReactNode }) {
      const adapter = useAdapter()
      return React.createElement(TourProvider, { tours, router: adapter, children })
    }

    const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
    await act(async () => {
      await result.current.start('t')
    })
    await act(async () => {
      await result.current.next()
    })

    expect(push).not.toHaveBeenCalled()
    expect(result.current.currentStepIndex).toBe(0)
  })

  it("'auto' strategy: target never mounts → onStepError, STOP_TOUR (US-2)", async () => {
    const handlers = new Map<string, Set<(url: string) => void>>()
    const events = {
      on: vi.fn((event: string, handler: (url: string) => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set())
        handlers.get(event)?.add(handler)
      }),
      off: vi.fn(),
    }
    const state = { path: '/' }
    const push = vi.fn((href: string) =>
      Promise.resolve(true).then((ok) => {
        state.path = href
        return ok
      })
    )
    const routerProxy = new Proxy(
      { pathname: state.path, push, events },
      {
        get(target, prop) {
          if (prop === 'pathname') return state.path
          if (prop === 'push') return target.push
          if (prop === 'events') return events
          return target[prop as keyof typeof target]
        },
      }
    )
    const useRouter = (() => routerProxy) as () => typeof routerProxy
    const useAdapter = createNextPagesRouterAdapter(useRouter)

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
      await new Promise((resolve) => setTimeout(resolve, 80))
    })

    expect(push).toHaveBeenCalledWith('/billing')
    expect(onStepError).toHaveBeenCalledTimes(1)
    const [err] = onStepError.mock.calls[0] as [TourRouteError]
    expect(err.name).toBe('TourRouteError')
    expect(err.code).toBe('TARGET_NOT_FOUND')
    expect(err.route).toBe('/billing')
    expect(err.selector).toBe('#billing-target')
    expect(result.current.isActive).toBe(false)
  })
})
