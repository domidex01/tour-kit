import * as React from 'react'
import type { AnalyticsConfig } from '../types/plugin'
import { type TourAnalytics, createAnalytics } from './tracker'

const AnalyticsContext = React.createContext<TourAnalytics | null>(null)

AnalyticsContext.displayName = 'TourKitAnalyticsContext'

interface AnalyticsProviderProps {
  /** Analytics configuration */
  config: AnalyticsConfig
  children: React.ReactNode
}

/**
 * Provider component for TourKit analytics
 */
export function AnalyticsProvider({ config, children }: AnalyticsProviderProps) {
  const analyticsRef = React.useRef<TourAnalytics | null>(null)

  // Create analytics instance once
  if (!analyticsRef.current) {
    analyticsRef.current = createAnalytics(config)
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      analyticsRef.current?.destroy()
    }
  }, [])

  // Handle beforeunload to track abandonment
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      analyticsRef.current?.flush()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <AnalyticsContext.Provider value={analyticsRef.current}>{children}</AnalyticsContext.Provider>
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
