import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

/**
 * SSR-safe media query hook.
 *
 * Uses `useSyncExternalStore` so the server snapshot (`false`) is also used for
 * the first client (hydration) render, then React re-renders with the real
 * `matchMedia` value after hydration. This guarantees the first client render
 * matches the server output — no hydration mismatch — without reading
 * `matchMedia` in a render-time initializer.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {}
      }
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])

  // Server (and first hydration render) always reports `false` so client and
  // server agree on the initial markup.
  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * SSR-safe wrapper around `usePrefersReducedMotion` that defaults to `true`
 * server-side and on first client render (Comeau pattern), then flips to the
 * actual `matchMedia` value after the first effect.
 *
 * Why: animation classes that depend on this hook must default to "no
 * animation" during SSR/first paint to avoid a one-frame motion flash for
 * users who have requested reduced motion.
 */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(true)
  const matches = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    setReduce(matches)
  }, [matches])

  return reduce
}
