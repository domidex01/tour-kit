import { useTour } from '@tour-kit/core'
import type { RouterAdapter, TourStep } from '@tour-kit/core'
import * as React from 'react'

interface UseTourRouteOptions {
  /** Router adapter */
  router: RouterAdapter
  /** Tour ID (optional, uses active tour if not specified) */
  tourId?: string
}

interface UseTourRouteReturn {
  /** Current step is on current route */
  isStepOnCurrentRoute: boolean
  /** Route of current step */
  currentStepRoute: string | undefined
  /** Current route from router */
  currentRoute: string
  /** Whether navigation is pending */
  isNavigating: boolean
  /** Navigate to current step's route */
  goToStepRoute: () => Promise<void>
  /** Check if a specific route matches the current route */
  isOnRoute: (route: string, mode?: 'exact' | 'startsWith' | 'contains') => boolean
}

/**
 * Hook for route-aware tour operations.
 *
 * @example
 * ```tsx
 * function TourComponent() {
 *   const router = useNextAppRouter()
 *   const {
 *     isStepOnCurrentRoute,
 *     currentStepRoute,
 *     goToStepRoute
 *   } = useTourRoute({ router })
 *
 *   if (!isStepOnCurrentRoute) {
 *     return (
 *       <button onClick={goToStepRoute}>
 *         Go to {currentStepRoute}
 *       </button>
 *     )
 *   }
 *
 *   return <TourCard />
 * }
 * ```
 */
export function useTourRoute({ router, tourId }: UseTourRouteOptions): UseTourRouteReturn {
  const tour = useTour(tourId)
  const [isNavigating, setIsNavigating] = React.useState(false)

  const currentStep = tour.currentStep as TourStep | null
  const currentStepRoute = currentStep?.route
  const currentRoute = router.getCurrentRoute()

  const isStepOnCurrentRoute = React.useMemo(() => {
    if (!currentStepRoute) return true // No route = any route is fine

    const matchMode = currentStep?.routeMatch ?? 'exact'
    return router.matchRoute(currentStepRoute, matchMode)
  }, [currentStepRoute, router, currentStep?.routeMatch])

  const goToStepRoute = React.useCallback(async () => {
    if (!currentStepRoute || isStepOnCurrentRoute) return

    setIsNavigating(true)
    try {
      await router.navigate(currentStepRoute)
    } finally {
      setIsNavigating(false)
    }
  }, [currentStepRoute, isStepOnCurrentRoute, router])

  const isOnRoute = React.useCallback(
    (route: string, mode: 'exact' | 'startsWith' | 'contains' = 'exact') => {
      return router.matchRoute(route, mode)
    },
    [router]
  )

  return {
    isStepOnCurrentRoute,
    currentStepRoute,
    currentRoute,
    isNavigating,
    goToStepRoute,
    isOnRoute,
  }
}
