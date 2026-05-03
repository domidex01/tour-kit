'use client'

import { useThemeContext } from '../components/theme/theme-provider'
import type { ThemeContextValue } from '../components/theme/types'

export type UseThemeVariationReturn = ThemeContextValue

/**
 * Subscribe to the active theme variation.
 *
 * Returns `{ activeId, tokens }` from the surrounding `<ThemeProvider>`.
 * The reference identity is stable across re-renders unless the resolved
 * variation actually changes — safe to use directly in `useEffect` deps.
 *
 * Memoize the `traits` prop on `<ThemeProvider>` to honor the perf budget;
 * an inline `traits={{ ... }}` object creates a new reference each render
 * and forces the resolver effect to re-run.
 */
export function useThemeVariation(): UseThemeVariationReturn {
  return useThemeContext()
}
