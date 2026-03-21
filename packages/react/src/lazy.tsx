'use client'

import { type ReactNode, Suspense, lazy } from 'react'

// Lazy-loaded components for code splitting
export const LazyTourCard = lazy(() =>
  import('./components/card/tour-card').then((m) => ({ default: m.TourCard }))
)

export const LazyTourOverlay = lazy(() =>
  import('./components/overlay/tour-overlay').then((m) => ({ default: m.TourOverlay }))
)

export const LazyTourStep = lazy(() =>
  import('./components/tour/tour-step').then((m) => ({ default: m.TourStep }))
)

export const LazyTour = lazy(() =>
  import('./components/tour/tour').then((m) => ({ default: m.Tour }))
)

export const LazyTourNavigation = lazy(() =>
  import('./components/navigation/tour-navigation').then((m) => ({ default: m.TourNavigation }))
)

export const LazyTourProgress = lazy(() =>
  import('./components/navigation/tour-progress').then((m) => ({ default: m.TourProgress }))
)

export const LazyTourClose = lazy(() =>
  import('./components/navigation/tour-close').then((m) => ({ default: m.TourClose }))
)

// Preload functions for warming the cache
export const preloadTourCard = () => import('./components/card/tour-card')

export const preloadTourOverlay = () => import('./components/overlay/tour-overlay')

export const preloadTourStep = () => import('./components/tour/tour-step')

export const preloadTour = () => import('./components/tour/tour')

export const preloadTourNavigation = () => import('./components/navigation/tour-navigation')

export const preloadTourProgress = () => import('./components/navigation/tour-progress')

export const preloadTourClose = () => import('./components/navigation/tour-close')

// Preload all main components at once
export const preloadAllTourComponents = () =>
  Promise.all([
    preloadTourCard(),
    preloadTourOverlay(),
    preloadTourStep(),
    preloadTour(),
    preloadTourNavigation(),
    preloadTourProgress(),
    preloadTourClose(),
  ])

// Suspense wrapper component
export interface TourSuspenseProps {
  children: ReactNode
  fallback?: ReactNode
}

export function TourSuspense({ children, fallback = null }: TourSuspenseProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}
