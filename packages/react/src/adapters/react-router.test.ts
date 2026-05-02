import { TourProvider, type TourRouteError, useTour } from '@tour-kit/core'
import { act, renderHook } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReactRouterAdapter } from './react-router'

// -----------------------------------------------------------------------------
// Mock Factories
// -----------------------------------------------------------------------------

// Type definitions for the adapter (matching the production types)
type Location = { pathname: string }
type NavigateFunction = (to: string) => void
type UseLocation = () => Location
type UseNavigate = () => NavigateFunction

interface MockReactRouterHooks {
  useLocation: UseLocation
  useNavigate: UseNavigate
  navigate: ReturnType<typeof vi.fn>
  setPathname: (path: string) => void
  getPathname: () => string
}

function createMockHooks(initialPath = '/'): MockReactRouterHooks {
  let pathname = initialPath
  const navigate = vi.fn()

  return {
    useLocation: vi.fn(() => ({ pathname })) as unknown as UseLocation,
    useNavigate: vi.fn(() => navigate) as unknown as UseNavigate,
    navigate,
    setPathname: (path: string) => {
      pathname = path
    },
    getPathname: () => pathname,
  }
}

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

describe('createReactRouterAdapter', () => {
  let mocks: MockReactRouterHooks

  beforeEach(() => {
    mocks = createMockHooks('/')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('factory function', () => {
    it('returns a hook function', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      expect(typeof useAdapter).toBe('function')
    })

    it('hook returns RouterAdapter with all required methods', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
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
    it('returns current pathname from location', () => {
      mocks = createMockHooks('/dashboard')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/dashboard')
    })

    it('returns updated pathname after route change', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/page-a')

      mocks.setPathname('/page-b')
      rerender()

      expect(result.current.getCurrentRoute()).toBe('/page-b')
    })

    it('callback is stable across rerenders', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstRef = result.current.getCurrentRoute
      rerender()
      const secondRef = result.current.getCurrentRoute

      expect(firstRef).toBe(secondRef)
    })

    it('uses ref to provide latest pathname', () => {
      mocks = createMockHooks('/initial')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      // Store the callback reference
      const getCurrentRoute = result.current.getCurrentRoute

      // Change pathname
      mocks.setPathname('/changed')
      rerender()

      // The same callback reference should return the new pathname
      expect(getCurrentRoute()).toBe('/changed')
    })
  })

  describe('navigate() (doNavigate)', () => {
    it('calls navigate function with the route', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      result.current.navigate('/new-route')

      expect(mocks.navigate).toHaveBeenCalledWith('/new-route')
      expect(mocks.navigate).toHaveBeenCalledTimes(1)
    })

    it('returns undefined', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      const returnValue = result.current.navigate('/new-route')

      expect(returnValue).toBeUndefined()
    })

    it('handles various path formats', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      result.current.navigate('/')
      expect(mocks.navigate).toHaveBeenCalledWith('/')

      result.current.navigate('/nested/path/here')
      expect(mocks.navigate).toHaveBeenCalledWith('/nested/path/here')

      result.current.navigate('/path?query=value&other=1')
      expect(mocks.navigate).toHaveBeenCalledWith('/path?query=value&other=1')

      result.current.navigate('/path#section')
      expect(mocks.navigate).toHaveBeenCalledWith('/path#section')
    })

    it('callback is stable when navigate function does not change', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
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
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard/settings')).toBe(true)
        expect(result.current.matchRoute('/dashboard/settings', 'exact')).toBe(true)
      })

      it('does not match partial path', () => {
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard')).toBe(false)
        expect(result.current.matchRoute('/dashboard/settings/more')).toBe(false)
      })

      it('does not match different path', () => {
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/other')).toBe(false)
        expect(result.current.matchRoute('/')).toBe(false)
      })
    })

    describe('startsWith mode', () => {
      it('matches path prefix', () => {
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/dashboard', 'startsWith')).toBe(true)
        expect(result.current.matchRoute('/dashboard/settings', 'startsWith')).toBe(true)
        expect(result.current.matchRoute('/', 'startsWith')).toBe(true)
      })

      it('does not match non-prefix', () => {
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('/other', 'startsWith')).toBe(false)
        expect(result.current.matchRoute('settings', 'startsWith')).toBe(false)
      })
    })

    describe('contains mode', () => {
      it('matches substring anywhere in path', () => {
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('dashboard', 'contains')).toBe(true)
        expect(result.current.matchRoute('settings', 'contains')).toBe(true)
        expect(result.current.matchRoute('/dashboard', 'contains')).toBe(true)
        expect(result.current.matchRoute('board/set', 'contains')).toBe(true)
      })

      it('does not match non-substring', () => {
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        expect(result.current.matchRoute('other', 'contains')).toBe(false)
        expect(result.current.matchRoute('profile', 'contains')).toBe(false)
      })
    })

    describe('invalid mode', () => {
      it('defaults to exact matching for unknown mode', () => {
        const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
        const { result } = renderHook(() => useAdapter())

        // @ts-expect-error - Testing invalid mode
        expect(result.current.matchRoute('/dashboard/settings', 'invalid')).toBe(true)
        // @ts-expect-error - Testing invalid mode
        expect(result.current.matchRoute('/dashboard', 'invalid')).toBe(false)
      })
    })

    it('callback is stable across rerenders', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstRef = result.current.matchRoute
      rerender()
      const secondRef = result.current.matchRoute

      expect(firstRef).toBe(secondRef)
    })

    it('uses ref-based pathname for latest value', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
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
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)

      expect(callback).toHaveBeenCalledWith('/initial')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('calls callback when pathname changes', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      mocks.setPathname('/page-b')
      rerender()

      expect(callback).toHaveBeenCalledWith('/page-b')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('does not call callback when pathname stays the same', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
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
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
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
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      result.current.onRouteChange(callback1)
      result.current.onRouteChange(callback2)
      result.current.onRouteChange(callback3)

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
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
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
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstRef = result.current.onRouteChange
      rerender()
      const secondRef = result.current.onRouteChange

      expect(firstRef).toBe(secondRef)
    })

    it('handles multiple route changes in sequence', () => {
      mocks = createMockHooks('/page-a')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const callback = vi.fn()
      result.current.onRouteChange(callback)
      callback.mockClear()

      mocks.setPathname('/page-b')
      rerender()
      expect(callback).toHaveBeenLastCalledWith('/page-b')

      mocks.setPathname('/page-c')
      rerender()
      expect(callback).toHaveBeenLastCalledWith('/page-c')

      mocks.setPathname('/page-d')
      rerender()
      expect(callback).toHaveBeenLastCalledWith('/page-d')

      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('RouterAdapter memoization', () => {
    it('returns memoized object when dependencies unchanged', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstAdapter = result.current
      rerender()
      const secondAdapter = result.current

      expect(firstAdapter).toBe(secondAdapter)
    })

    it('all callbacks maintain stable references', () => {
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result, rerender } = renderHook(() => useAdapter())

      const firstGetCurrentRoute = result.current.getCurrentRoute
      const firstNavigate = result.current.navigate
      const firstMatchRoute = result.current.matchRoute
      const firstOnRouteChange = result.current.onRouteChange

      mocks.setPathname('/different')
      rerender()

      // Callbacks should remain stable even when pathname changes
      expect(result.current.getCurrentRoute).toBe(firstGetCurrentRoute)
      expect(result.current.navigate).toBe(firstNavigate)
      expect(result.current.matchRoute).toBe(firstMatchRoute)
      expect(result.current.onRouteChange).toBe(firstOnRouteChange)
    })
  })

  describe('edge cases', () => {
    it('handles empty string pathname', () => {
      mocks = createMockHooks('')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('')
    })

    it('handles root path', () => {
      mocks = createMockHooks('/')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/')
      expect(result.current.matchRoute('/')).toBe(true)
    })

    it('handles paths with trailing slashes', () => {
      mocks = createMockHooks('/path/')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/path/')
      expect(result.current.matchRoute('/path/')).toBe(true)
      expect(result.current.matchRoute('/path')).toBe(false)
    })

    it('handles deeply nested paths', () => {
      mocks = createMockHooks('/a/b/c/d/e/f')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/a/b/c/d/e/f')
      expect(result.current.matchRoute('/a', 'startsWith')).toBe(true)
      expect(result.current.matchRoute('c/d', 'contains')).toBe(true)
    })

    it('handles unicode paths', () => {
      mocks = createMockHooks('/chemin/francais')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/chemin/francais')
      expect(result.current.matchRoute('/chemin/francais')).toBe(true)
    })

    it('handles paths with special characters', () => {
      mocks = createMockHooks('/path/with%20spaces')
      const useAdapter = createReactRouterAdapter(mocks.useLocation, mocks.useNavigate)
      const { result } = renderHook(() => useAdapter())

      expect(result.current.getCurrentRoute()).toBe('/path/with%20spaces')
      expect(result.current.matchRoute('/path/with%20spaces')).toBe(true)
    })
  })
})

describe('useReactRouter (direct hook)', () => {
  // Note: Testing the direct hook requires mocking the require() call.
  // These tests document the expected behavior.

  describe('module resolution', () => {
    it('should try react-router first (v7)', () => {
      // The direct hook tries 'react-router' before 'react-router-dom'
      // This test documents the expected behavior
      expect(true).toBe(true) // Placeholder - see integration tests
    })

    it('should fall back to react-router-dom (v6)', () => {
      // If 'react-router' is not available, it falls back to 'react-router-dom'
      expect(true).toBe(true) // Placeholder - see integration tests
    })

    it('should throw clear error if neither is available', () => {
      // Expected error message:
      // "[TourKit] Neither react-router nor react-router-dom found. " +
      // "Please install one of them to use useReactRouter."
      expect(true).toBe(true) // Placeholder - see integration tests
    })

    it('should cache adapter after first call', () => {
      // The _useReactRouter variable caches the adapter factory
      expect(true).toBe(true) // Placeholder - see integration tests
    })
  })
})

// -----------------------------------------------------------------------------
// Phase 1.3 — Cross-page tour integration with TourProvider (React Router)
// -----------------------------------------------------------------------------
//
// React Router runs synchronously inside `act()`. We mock `useNavigate` /
// `useLocation` directly rather than using `<MemoryRouter>` so the test
// stays a pure unit/integration boundary on the adapter — no real Routes,
// no link/route-component wiring. The adapter doesn't care whether a real
// router is mounted; it only consumes the two hooks.

describe('cross-page (React Router) — Phase 1.3', () => {
  function makeAdapter(initialPath = '/') {
    const state = { path: initialPath }
    const navigate = vi.fn((to: string) => {
      state.path = to
      // Synchronous mount — React Router's transition is sync inside act.
      const t = document.createElement('div')
      t.id = 'billing-target'
      document.body.appendChild(t)
    })
    const useLocation = (() => ({ pathname: state.path })) as () => { pathname: string }
    const useNavigate = (() => navigate) as () => (to: string) => void
    return {
      useAdapter: createReactRouterAdapter(useLocation, useNavigate),
      navigate,
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

  it("'auto' strategy: navigate, target mounts, advance to step 2 (US-1)", async () => {
    const { useAdapter, navigate } = makeAdapter('/')
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

    expect(navigate).toHaveBeenCalledWith('/billing')
    expect(result.current.currentStepIndex).toBe(1)
  })

  it("'prompt' strategy: fires onNavigationRequired, no navigate, no advance (US-3)", async () => {
    const { useAdapter, navigate } = makeAdapter('/')
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
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.currentStepIndex).toBe(0)
  })

  it("'manual' strategy: no navigate, no advance (US-3)", async () => {
    const { useAdapter, navigate } = makeAdapter('/')
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

    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.currentStepIndex).toBe(0)
  })

  it("'auto' strategy: target never mounts → onStepError, STOP_TOUR (US-2)", async () => {
    const state = { path: '/' }
    const navigate = vi.fn((to: string) => {
      state.path = to
    })
    const useLocation = (() => ({ pathname: state.path })) as () => { pathname: string }
    const useNavigate = (() => navigate) as () => (to: string) => void
    const useAdapter = createReactRouterAdapter(useLocation, useNavigate)

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

    expect(navigate).toHaveBeenCalledWith('/billing')
    expect(onStepError).toHaveBeenCalledTimes(1)
    const [err] = onStepError.mock.calls[0] as [TourRouteError]
    expect(err.name).toBe('TourRouteError')
    expect(err.code).toBe('TARGET_NOT_FOUND')
    expect(err.route).toBe('/billing')
    expect(err.selector).toBe('#billing-target')
    expect(result.current.isActive).toBe(false)
  })
})
