'use client'

import * as React from 'react'
import type { AnalyticsTracker } from '../types/analytics'

const AnalyticsContext = React.createContext<AnalyticsTracker | null>(null)

AnalyticsContext.displayName = 'TourKitAnalyticsContext'

export interface AnalyticsProviderProps {
  analytics: AnalyticsTracker | null
  children: React.ReactNode
}

/**
 * Provides an optional analytics tracker to Tour Kit packages without tying
 * free packages to the proprietary tracker implementation.
 */
export function AnalyticsProvider({ analytics, children }: AnalyticsProviderProps) {
  return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>
}

/**
 * Hook to access the active analytics tracker.
 */
export function useAnalytics(): AnalyticsTracker {
  const analytics = React.useContext(AnalyticsContext)
  if (!analytics) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return analytics
}

/**
 * Hook to optionally access analytics. Returns null when no provider is mounted.
 */
export function useAnalyticsOptional(): AnalyticsTracker | null {
  return React.useContext(AnalyticsContext)
}
