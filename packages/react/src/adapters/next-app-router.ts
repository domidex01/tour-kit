'use client'

import type { RouterAdapter } from '@tour-kit/core'
import { useCallback, useEffect, useMemo, useRef } from 'react'

// biome-ignore lint/suspicious/noExplicitAny: require returns dynamic module
declare const require: (module: string) => any

// Type-only import for Next.js types
type NextRouter = {
  push: (href: string) => void
}

type UsePathname = () => string | null
type UseRouter = () => NextRouter

/**
 * Router adapter for Next.js App Router (next/navigation)
 *
 * @remarks
 * - Uses `usePathname()` for current route detection
 * - Uses `useRouter().push()` for navigation
 * - Route changes detected via pathname reactivity
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { useNextAppRouter } from '@tour-kit/react'
 *
 * function App() {
 *   const router = useNextAppRouter()
 *   return <MultiTourKitProvider router={router}>...</MultiTourKitProvider>
 * }
 * ```
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/use-router
 * @see https://nextjs.org/docs/app/api-reference/functions/use-pathname
 */
export function createNextAppRouterAdapter(
  usePathname: UsePathname,
  useRouter: UseRouter
): () => RouterAdapter {
  return function useNextAppRouter(): RouterAdapter {
    // usePathname() can return null during SSR in edge cases
    const pathname = usePathname() ?? '/'
    const router = useRouter()
    const callbacksRef = useRef<Set<(route: string) => void>>(new Set())
    const previousPathRef = useRef<string>(pathname)
    // Store current pathname in ref for stable callbacks
    const pathnameRef = useRef<string>(pathname)
    pathnameRef.current = pathname

    // Notify subscribers when pathname changes
    useEffect(() => {
      if (previousPathRef.current !== pathname) {
        previousPathRef.current = pathname
        for (const cb of callbacksRef.current) {
          cb(pathname)
        }
      }
    }, [pathname])

    // Use refs in callbacks to avoid recreating them on every pathname change
    const getCurrentRoute = useCallback(() => pathnameRef.current, [])

    const navigate = useCallback(
      (route: string): undefined => {
        router.push(route)
        return undefined
      },
      [router]
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
        navigate,
        matchRoute,
        onRouteChange,
      }),
      [getCurrentRoute, navigate, matchRoute, onRouteChange]
    )
  }
}

// Direct hook that imports from next/navigation
// Note: This will throw if next/navigation is not available
let _useNextAppRouter: (() => RouterAdapter) | null = null

/**
 * Router adapter hook for Next.js App Router.
 * Automatically imports from 'next/navigation'.
 *
 * @throws If next/navigation is not available
 */
export function useNextAppRouter(): RouterAdapter {
  if (!_useNextAppRouter) {
    // Dynamic import at runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const navigation = require('next/navigation')
    _useNextAppRouter = createNextAppRouterAdapter(navigation.usePathname, navigation.useRouter)
  }
  return _useNextAppRouter()
}
