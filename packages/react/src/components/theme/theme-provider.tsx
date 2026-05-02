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
  // SSR-safe initial state — never compute on server. The first client effect
  // resolves and applies the active theme to avoid hydration mismatches.
  const [activeId, setActiveId] = React.useState<string>(defaultId)
  const [tokens, setTokens] = React.useState<ThemeTokens>({})
  const [route, setRoute] = React.useState<string | null>(null)
  const [mounted, setMounted] = React.useState(false)

  const isDark = useMediaQuery('(prefers-color-scheme: dark)')
  const systemColorScheme: 'light' | 'dark' | null = mounted
    ? isDark
      ? 'dark'
      : 'light'
    : null

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!router) return
    setRoute(router.getCurrentRoute())
    const unsubscribe = router.onRouteChange((next) => setRoute(next))
    return unsubscribe
  }, [router])

  React.useEffect(() => {
    if (!mounted) return
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
  }, [variations, systemColorScheme, route, forceMode, mounted])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ activeId, tokens }),
    [activeId, tokens],
  )

  // Server render and first client render emit the same `defaultId` attribute,
  // so hydration matches. The effect above flips it to the resolved variation.
  const styleProp = mounted ? (tokens as React.CSSProperties) : undefined

  return (
    <ThemeContext.Provider value={value}>
      <div data-tk-theme={mounted ? activeId : defaultId} style={styleProp}>
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
