import type { RouterAdapter } from '@tour-kit/core'
import { useCallback, useEffect, useMemo, useRef } from 'react'

// biome-ignore lint/suspicious/noExplicitAny: require returns dynamic module
declare const require: (module: string) => any

// Type-only imports for React Router types
type Location = {
  pathname: string
}

type NavigateFunction = (to: string) => void

type UseLocation = () => Location
type UseNavigate = () => NavigateFunction

/**
 * Router adapter for React Router v6/v7
 *
 * For React Router v6: import from 'react-router-dom'
 * For React Router v7: import from 'react-router'
 *
 * This adapter works with both versions.
 *
 * @remarks
 * - Uses `useLocation()` for current route detection
 * - Uses `useNavigate()` for navigation
 * - Route changes detected via location.pathname reactivity
 *
 * @example
 * ```tsx
 * // React Router v6 (react-router-dom)
 * import { BrowserRouter } from 'react-router-dom'
 * import { useReactRouter, MultiTourKitProvider } from '@tour-kit/react'
 *
 * function TourKitProviderWithRouter({ children }) {
 *   const router = useReactRouter()
 *   return <MultiTourKitProvider router={router}>{children}</MultiTourKitProvider>
 * }
 *
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <TourKitProviderWithRouter>
 *         <Routes>...</Routes>
 *       </TourKitProviderWithRouter>
 *     </BrowserRouter>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // React Router v7 (react-router)
 * import { BrowserRouter } from 'react-router'
 * import { useReactRouter, MultiTourKitProvider } from '@tour-kit/react'
 *
 * function TourKitProviderWithRouter({ children }) {
 *   const router = useReactRouter()
 *   return <MultiTourKitProvider router={router}>{children}</MultiTourKitProvider>
 * }
 * ```
 *
 * @see https://reactrouter.com/home
 */
export function createReactRouterAdapter(
  useLocation: UseLocation,
  useNavigate: UseNavigate
): () => RouterAdapter {
  return function useReactRouter(): RouterAdapter {
    const location = useLocation()
    const navigate = useNavigate()
    const callbacksRef = useRef<Set<(route: string) => void>>(new Set())
    const previousPathRef = useRef<string>(location.pathname)
    // Store current pathname in ref for stable callbacks
    const pathnameRef = useRef<string>(location.pathname)
    pathnameRef.current = location.pathname

    // Notify subscribers when location changes
    useEffect(() => {
      if (previousPathRef.current !== location.pathname) {
        previousPathRef.current = location.pathname
        for (const cb of callbacksRef.current) {
          cb(location.pathname)
        }
      }
    }, [location.pathname])

    // Use refs in callbacks to avoid recreating them on every pathname change
    const getCurrentRoute = useCallback(() => pathnameRef.current, [])

    const doNavigate = useCallback(
      (route: string): undefined => {
        navigate(route)
        return undefined
      },
      [navigate]
    )

    const matchRoute = useCallback(
      (pattern: string, mode: 'exact' | 'startsWith' | 'contains' = 'exact') => {
        const currentPath = pathnameRef.current
        switch (mode) {
          case 'exact':
            return currentPath === pattern
          case 'startsWith':
            return currentPath.startsWith(pattern)
          case 'contains':
            return currentPath.includes(pattern)
          default:
            return currentPath === pattern
        }
      },
      []
    )

    const onRouteChange = useCallback((callback: (route: string) => void) => {
      callbacksRef.current.add(callback)
      // Call immediately with current route for initialization
      callback(pathnameRef.current)
      return () => {
        callbacksRef.current.delete(callback)
      }
    }, [])

    // Memoize the router adapter object to prevent unnecessary re-renders
    return useMemo<RouterAdapter>(
      () => ({
        getCurrentRoute,
        navigate: doNavigate,
        matchRoute,
        onRouteChange,
      }),
      [getCurrentRoute, doNavigate, matchRoute, onRouteChange]
    )
  }
}

// Direct hook that tries to import from react-router or react-router-dom
let _useReactRouter: (() => RouterAdapter) | null = null

/**
 * Router adapter hook for React Router v6/v7.
 * Automatically imports from 'react-router' (v7) or 'react-router-dom' (v6).
 *
 * @throws If neither react-router nor react-router-dom is available
 */
export function useReactRouter(): RouterAdapter {
  if (!_useReactRouter) {
    // Try react-router first (v7), then react-router-dom (v6)
    let reactRouter: { useLocation: UseLocation; useNavigate: UseNavigate }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      reactRouter = require('react-router')
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        reactRouter = require('react-router-dom')
      } catch {
        throw new Error(
          '[TourKit] Neither react-router nor react-router-dom found. ' +
            'Please install one of them to use useReactRouter.'
        )
      }
    }
    _useReactRouter = createReactRouterAdapter(reactRouter.useLocation, reactRouter.useNavigate)
  }
  return _useReactRouter()
}
