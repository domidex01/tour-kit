'use client'

import { useMediaQuery } from '@tour-kit/core'
import type { RouterAdapter } from '@tour-kit/core'
import * as React from 'react'
import { resolveTheme } from './theme-resolver'
import type { ThemeContextValue, ThemeTokens, ThemeVariation } from './types'

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export interface ThemeProviderProps {
  variations: ThemeVariation[]
  router?: RouterAdapter
  forceMode?: 'dark' | 'light' | null
  defaultId?: string
  children: React.ReactNode
}

export function ThemeProvider({
  variations,
  router,
  forceMode = null,
  defaultId = 'default',
  children,
}: ThemeProviderProps) {
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
    const match = resolveTheme(variations, { systemColorScheme, route })
    if (match) {
      setActiveId(match.id)
      setTokens(match.theme)
    }
  }, [variations, systemColorScheme, route, forceMode])

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
