import * as React from 'react'
import type { TourKitConfig } from '../types'
import { getDocumentDirection } from '../utils/position'
import { TourKitContext, type TourKitContextValue } from './tourkit-context'

export interface TourKitProviderProps {
  children: React.ReactNode
  config?: TourKitConfig
  onTourStart?: (tourId: string) => void
  onTourComplete?: (tourId: string) => void
  onTourSkip?: (tourId: string, stepIndex: number) => void
  onStepView?: (tourId: string, stepId: string, stepIndex: number) => void
}

/**
 * Resolve direction from config
 * - 'ltr' or 'rtl': Use as-is
 * - 'auto' or undefined: Detect from document.dir
 */
function resolveDirection(configDir: TourKitConfig['dir']): 'ltr' | 'rtl' {
  if (configDir === 'ltr' || configDir === 'rtl') {
    return configDir
  }
  // 'auto' or undefined - detect from document
  return getDocumentDirection()
}

export function TourKitProvider({
  children,
  config = {},
  onTourStart,
  onTourComplete,
  onTourSkip,
  onStepView,
}: TourKitProviderProps) {
  // Resolve direction on mount and when config changes
  const [direction, setDirection] = React.useState<'ltr' | 'rtl'>(() =>
    resolveDirection(config.dir)
  )

  // Update direction when config changes or document dir changes
  React.useEffect(() => {
    const resolved = resolveDirection(config.dir)
    setDirection(resolved)

    // If auto-detecting, observe document dir changes
    if (config.dir === 'auto' || config.dir === undefined) {
      if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
        const observer = new MutationObserver(() => {
          setDirection(getDocumentDirection())
        })

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['dir'],
        })

        return () => observer.disconnect()
      }
    }
  }, [config.dir])

  const isRTL = direction === 'rtl'

  const value = React.useMemo<TourKitContextValue>(
    () => ({
      config,
      direction,
      isRTL,
      onTourStart,
      onTourComplete,
      onTourSkip,
      onStepView,
    }),
    [config, direction, isRTL, onTourStart, onTourComplete, onTourSkip, onStepView]
  )

  return <TourKitContext.Provider value={value}>{children}</TourKitContext.Provider>
}
