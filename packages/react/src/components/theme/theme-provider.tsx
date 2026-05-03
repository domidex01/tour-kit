'use client'

import { useMediaQuery } from '@tour-kit/core'
import type { RouterAdapter } from '@tour-kit/core'
import * as React from 'react'
import { resolveTheme } from './theme-resolver'
import type { ThemeContextValue, ThemeTokens, ThemeVariation } from './types'

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export interface ThemeProviderProps<TTraits = Record<string, unknown>> {
  variations: ThemeVariation[]
  router?: RouterAdapter
  forceMode?: 'dark' | 'light' | null
  defaultId?: string
  /**
   * Host-provided traits evaluated by `{ kind: 'predicate' }` matchers.
   * Memoize this object — the resolver effect's deps include `traits`, so a
   * fresh reference each render forces re-resolution and breaks the perf budget.
   */
  traits?: TTraits
  children: React.ReactNode
}

export function ThemeProvider<TTraits = Record<string, unknown>>({
  variations,
  router,
  forceMode = null,
  defaultId = 'default',
  traits,
  children,
}: ThemeProviderProps<TTraits>) {
  // Server render and first client render both emit `defaultId` because state
  // is initialized to it and no effect has run yet — so hydration matches.
  // The effect below flips it to the resolved variation after mount.
  const [activeId, setActiveId] = React.useState<string>(defaultId)
  const [tokens, setTokens] = React.useState<ThemeTokens>({})
  const [route, setRoute] = React.useState<string | null>(null)

  const isDark = useMediaQuery('(prefers-color-scheme: dark)')
  const systemColorScheme: 'light' | 'dark' | null =
    typeof window === 'undefined' ? null : isDark ? 'dark' : 'light'

  React.useEffect(() => {
    if (!router) return
    setRoute(router.getCurrentRoute())
    return router.onRouteChange((next) => setRoute(next))
  }, [router])

  React.useEffect(() => {
    if (forceMode) {
      const forced = variations.find((v) => v.when.kind === forceMode)
      if (forced) {
        setActiveId(forced.id)
        setTokens(forced.theme)
        return
      }
    }
    const match = resolveTheme(variations, { systemColorScheme, route, traits })
    if (match) {
      setActiveId(match.id)
      setTokens(match.theme)
    }
  }, [variations, systemColorScheme, route, forceMode, traits])

  const value = React.useMemo<ThemeContextValue>(() => ({ activeId, tokens }), [activeId, tokens])

  return (
    <ThemeContext.Provider value={value}>
      <div data-tk-theme={activeId} style={tokens as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useThemeContext(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeContext must be used inside <ThemeProvider>')
  }
  return ctx
}
