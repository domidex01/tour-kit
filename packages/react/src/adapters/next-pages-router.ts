'use client'

import type { RouterAdapter } from '@tour-kit/core'
import { useCallback, useEffect, useRef } from 'react'

// biome-ignore lint/suspicious/noExplicitAny: require returns dynamic module
declare const require: (module: string) => any

// Type-only import for Next.js Pages Router types
type NextPagesRouter = {
  pathname: string
  push: (url: string) => Promise<boolean>
  events: {
    on: (event: string, handler: (url: string) => void) => void
    off: (event: string, handler: (url: string) => void) => void
  }
}

type UseRouter = () => NextPagesRouter

/**
 * Router adapter for Next.js Pages Router (next/router)
 *
 * @remarks
 * - Uses `router.pathname` for current route detection
 * - Uses `router.push()` for navigation (returns Promise<boolean>)
 * - Route changes detected via `router.events`
 *
 * @example
 * ```tsx
 * import { useNextPagesRouter } from '@tour-kit/react'
 *
 * function App() {
 *   const router = useNextPagesRouter()
 *   return <MultiTourKitProvider router={router}>...</MultiTourKitProvider>
 * }
 * ```
 *
 * @see https://nextjs.org/docs/pages/api-reference/functions/use-router
 */
export function createNextPagesRouterAdapter(useRouter: UseRouter): () => RouterAdapter {
  return function useNextPagesRouter(): RouterAdapter {
    const router = useRouter()
    const callbacksRef = useRef<Set<(route: string) => void>>(new Set())

    // Listen to Next.js Pages Router events
    useEffect(() => {
      const handleRouteChangeComplete = (url: string) => {
        // Extract pathname without query string
        const pathname = url.split('?')[0] ?? url
        for (const cb of callbacksRef.current) {
          cb(pathname)
        }
      }

      router.events.on('routeChangeComplete', handleRouteChangeComplete)
      return () => {
        router.events.off('routeChangeComplete', handleRouteChangeComplete)
      }
    }, [router.events])

    const getCurrentRoute = useCallback(() => router.pathname, [router.pathname])

    const navigate = useCallback(
      async (route: string) => {
        return router.push(route)
      },
      [router]
    )

    const matchRoute = useCallback(
      (pattern: string, mode: 'exact' | 'startsWith' | 'contains' = 'exact') => {
        const pathname = router.pathname
        switch (mode) {
          case 'exact':
            return pathname === pattern
          case 'startsWith':
            return pathname.startsWith(pattern)
          case 'contains':
            return pathname.includes(pattern)
          default:
            return pathname === pattern
        }
      },
      [router.pathname]
    )

    const onRouteChange = useCallback(
      (callback: (route: string) => void) => {
        callbacksRef.current.add(callback)
        // Call immediately with current route for initialization
        callback(router.pathname)
        return () => {
          callbacksRef.current.delete(callback)
        }
      },
      [router.pathname]
    )

    return {
      getCurrentRoute,
      navigate,
      matchRoute,
      onRouteChange,
    }
  }
}

// Direct hook that imports from next/router
let _useNextPagesRouter: (() => RouterAdapter) | null = null

/**
 * Router adapter hook for Next.js Pages Router.
 * Automatically imports from 'next/router'.
 *
 * @throws If next/router is not available
 */
export function useNextPagesRouter(): RouterAdapter {
  if (!_useNextPagesRouter) {
    // Dynamic import at runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nextRouter = require('next/router')
    _useNextPagesRouter = createNextPagesRouterAdapter(nextRouter.useRouter)
  }
  return _useNextPagesRouter()
}
