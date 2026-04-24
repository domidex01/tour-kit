import { ProGate } from '@tour-kit/license'
import * as React from 'react'
import type { AnalyticsConfig } from '../types/plugin'
import { type TourAnalytics, createAnalytics } from './tracker'

const AnalyticsContext = React.createContext<TourAnalytics | null>(null)

AnalyticsContext.displayName = 'TourKitAnalyticsContext'

interface AnalyticsProviderProps {
  /** Analytics configuration. Captured at mount; later changes do not rebuild the tracker. */
  config: AnalyticsConfig
  children: React.ReactNode
}

/**
 * Provider component for TourKit analytics.
 *
 * The analytics instance is created once via `useState` lazy init and kept for
 * the provider's lifetime. We intentionally do NOT call `analytics.destroy()`
 * on unmount: React 18 Strict Mode simulates an unmount/remount by firing
 * effect cleanup without re-running render, so a destroy-on-cleanup would
 * leave the committed context pointing at a torn-down instance with no way to
 * recreate it. Apps that need explicit teardown can call `analytics.destroy()`
 * imperatively via a ref or `useAnalytics()`.
 */
export function AnalyticsProvider({ config, children }: AnalyticsProviderProps) {
  const [analytics] = React.useState<TourAnalytics>(() => createAnalytics(config))

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      // Best-effort: drains the internal queue synchronously. In-flight plugin
      // network writes may still be cancelled by the unload — plugins that
      // need guaranteed delivery should use navigator.sendBeacon internally.
      void analytics.flush()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [analytics])

  return (
    <ProGate package="@tour-kit/analytics">
      <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>
    </ProGate>
  )
}

/**
 * Hook to access analytics tracker
 */
export function useAnalytics(): TourAnalytics {
  const analytics = React.useContext(AnalyticsContext)
  if (!analytics) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return analytics
}

/**
 * Hook to optionally access analytics (returns null if not in provider)
 */
export function useAnalyticsOptional(): TourAnalytics | null {
  return React.useContext(AnalyticsContext)
}
