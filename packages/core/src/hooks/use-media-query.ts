import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
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
