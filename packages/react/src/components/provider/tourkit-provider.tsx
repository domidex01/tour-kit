'use client'

import {
  TourKitProvider as CoreTourKitProvider,
  type MultiPagePersistenceConfig,
  type RouterAdapter,
  type TourKitConfig,
  TourProvider,
  type Tour as TourType,
} from '@tour-kit/core'
import * as React from 'react'

interface TourRegistryContextValue {
  registerTour: (tour: TourType) => void
  unregisterTour: (tourId: string) => void
  tours: TourType[]
}

const TourRegistryContext = React.createContext<TourRegistryContextValue | null>(null)

TourRegistryContext.displayName = 'TourRegistryContext'

export function useTourRegistryContext() {
  const context = React.useContext(TourRegistryContext)
  if (!context) {
    throw new Error('useTourRegistryContext must be used within TourKitProvider')
  }
  return context
}

export function useTourRegistryContextOptional() {
  return React.useContext(TourRegistryContext)
}

export interface MultiTourKitProviderProps {
  children: React.ReactNode
  /** Global configuration for all tours */
  config?: TourKitConfig
  /** Router adapter for multi-page tours */
  router?: RouterAdapter
  /** Persistence config for multi-page tours */
  routePersistence?: MultiPagePersistenceConfig
  /** Auto-navigate when step requires different route (default: true) */
  autoNavigate?: boolean
  /** Callback when navigation is needed but autoNavigate is false */
  onNavigationRequired?: (route: string, stepId: string) => void
  /** Called when any tour starts */
  onTourStart?: (tourId: string) => void
  /** Called when any tour completes */
  onTourComplete?: (tourId: string) => void
  /** Called when any tour is skipped */
  onTourSkip?: (tourId: string, stepIndex: number) => void
  /** Called when step changes in any tour */
  onStepView?: (tourId: string, stepId: string, stepIndex: number) => void
}

/**
 * Multi-tour provider that manages multiple tours with shared UI.
 *
 * **Compose-mode is the documented default.** Every consuming component —
 * `<Tour>`, `<TourOverlay>`, `<TourCard>`, and your `<App />` — sits as a
 * child of `<MultiTourKitProvider>` so `useTour()` resolves via the shared
 * registry regardless of nesting depth. Sibling-style placement (where a
 * `<Tour>` is rendered outside the provider) is not supported.
 *
 * @example
 * ```tsx
 * <MultiTourKitProvider onTourComplete={(id) => console.log(`${id} completed!`)}>
 *   <Tour id="onboarding">
 *     <TourStep id="welcome" target="#title" title="Welcome!" content="..." />
 *   </Tour>
 *   <Tour id="feature-tour">
 *     <TourStep id="feature" target="#feature" title="New Feature" content="..." />
 *   </Tour>
 *   <TourOverlay />
 *   <TourCard />
 *   <App />
 * </MultiTourKitProvider>
 * ```
 *
 * A `useTour()` call from any descendant — no matter how deeply nested —
 * returns the active controller. Re-registering the same tour id is
 * idempotent: existing entries are replaced rather than duplicated.
 */
export function MultiTourKitProvider({
  children,
  config = {},
  router,
  routePersistence,
  autoNavigate,
  onNavigationRequired,
  onTourStart,
  onTourComplete,
  onTourSkip,
  onStepView,
}: MultiTourKitProviderProps) {
  const [tours, setTours] = React.useState<TourType[]>([])

  const registerTour = React.useCallback((tour: TourType) => {
    setTours((prev) => {
      // Replace if exists, otherwise add
      const exists = prev.some((t) => t.id === tour.id)
      if (exists) {
        return prev.map((t) => (t.id === tour.id ? tour : t))
      }
      return [...prev, tour]
    })
  }, [])

  const unregisterTour = React.useCallback((tourId: string) => {
    setTours((prev) => prev.filter((t) => t.id !== tourId))
  }, [])

  const registryValue = React.useMemo<TourRegistryContextValue>(
    () => ({
      registerTour,
      unregisterTour,
      tours,
    }),
    [registerTour, unregisterTour, tours]
  )

  return (
    <TourRegistryContext.Provider value={registryValue}>
      <CoreTourKitProvider
        config={config}
        onTourStart={onTourStart}
        onTourComplete={onTourComplete}
        onTourSkip={onTourSkip}
        onStepView={onStepView}
      >
        <TourProvider
          tours={tours}
          router={router}
          routePersistence={routePersistence}
          autoNavigate={autoNavigate}
          onNavigationRequired={onNavigationRequired}
        >
          {children}
        </TourProvider>
      </CoreTourKitProvider>
    </TourRegistryContext.Provider>
  )
}
