'use client'

import {
  TourProvider,
  type TourStep as TourStepType,
  type Tour as TourType,
  useSegmentationContext,
  useSegments,
} from '@tour-kit/core'
import * as React from 'react'
import { evaluateAudience, useStepFilter } from '../../hooks/use-step-filter'
import { TourCard } from '../card/tour-card'
import { TourOverlay } from '../overlay/tour-overlay'
import { useTourRegistryContextOptional } from '../provider/tourkit-provider'
import { TourStep } from './tour-step'

export interface TourProps {
  id: string
  autoStart?: boolean
  startAt?: number
  /** Audience gate for the entire tour (Phase 3a). Mirrors `Tour.audience`. */
  audience?: TourType['audience']
  config?: Omit<TourType, 'id' | 'steps'>
  onStart?: () => void
  onComplete?: () => void
  onSkip?: () => void
  onStepChange?: (step: TourStepType, index: number) => void
  children: React.ReactNode
}

/**
 * Declarative tour definition component.
 *
 * When used within MultiTourKitProvider:
 * - Registers the tour with the shared provider
 * - Renders nothing (steps are managed by provider)
 *
 * When used standalone (no MultiTourKitProvider):
 * - Creates its own TourProvider
 * - Renders TourOverlay and TourCard
 *
 * @example
 * ```tsx
 * // With MultiTourKitProvider (multi-tour)
 * <MultiTourKitProvider>
 *   <Tour id="tour-1"><TourStep ... /></Tour>
 *   <Tour id="tour-2"><TourStep ... /></Tour>
 *   <TourOverlay />
 *   <TourCard />
 * </MultiTourKitProvider>
 *
 * // Standalone (single tour, backward compatible)
 * <Tour id="my-tour">
 *   <TourStep ... />
 *   <MyContent />
 * </Tour>
 * ```
 */
export function Tour({
  id,
  autoStart = false,
  startAt,
  audience,
  config,
  onStart,
  onComplete,
  onSkip,
  onStepChange,
  children,
}: TourProps) {
  const registryContext = useTourRegistryContextOptional()
  const segments = useSegments()
  const { userContext } = useSegmentationContext()
  const tourPasses = React.useMemo(
    () => evaluateAudience(audience ?? config?.audience, segments, userContext),
    [audience, config?.audience, segments, userContext]
  )

  // Idempotency guards: ensure onComplete/onSkip fire at most once per tour
  // activation. Prevents render-loop footgun when the parent unmounts the
  // Tour synchronously inside the callback (issue #6).
  const completedRef = React.useRef(false)
  const skippedRef = React.useRef(false)

  // Re-arm the guards if the tour identity changes (different tour mounted).
  // biome-ignore lint/correctness/useExhaustiveDependencies: `id` is the trigger; the body only resets refs
  React.useEffect(() => {
    completedRef.current = false
    skippedRef.current = false
  }, [id])

  // Extract TourStep children vs other content
  const { steps, content } = React.useMemo(() => {
    const stepElements: TourStepType[] = []
    const contentElements: React.ReactNode[] = []

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        // Check both reference equality and displayName for bundler compatibility
        const type = child.type as React.ComponentType & { displayName?: string }
        const isTourStep = type === TourStep || type.displayName === 'TourStep'

        if (isTourStep) {
          stepElements.push(child.props as TourStepType)
        } else {
          contentElements.push(child)
        }
      } else {
        contentElements.push(child)
      }
    })

    return { steps: stepElements, content: contentElements }
  }, [children])

  const filteredSteps = useStepFilter(steps)

  // Build tour config. `...config` is spread first so explicit prop-level
  // fields below win — otherwise `config.audience` would silently overwrite
  // the explicit `audience` prop and the registered tour metadata would
  // diverge from the gate evaluated above.
  const tour: TourType = React.useMemo(
    () => ({
      id,
      ...config,
      steps: filteredSteps,
      audience: audience ?? config?.audience,
      autoStart: autoStart ?? config?.autoStart,
      startAt: startAt ?? config?.startAt,
      onStart: onStart ? () => onStart() : undefined,
      onComplete: onComplete
        ? () => {
            if (completedRef.current) return
            completedRef.current = true
            onComplete()
          }
        : undefined,
      onSkip: onSkip
        ? () => {
            if (skippedRef.current) return
            skippedRef.current = true
            onSkip()
          }
        : undefined,
      onStepChange: onStepChange ? (step, index) => onStepChange(step, index) : undefined,
    }),
    [
      id,
      filteredSteps,
      audience,
      autoStart,
      startAt,
      config,
      onStart,
      onComplete,
      onSkip,
      onStepChange,
    ]
  )

  // Tour-level audience gate: when the audience predicate is false, skip
  // registration entirely so `useTour().isActive` stays false. Standalone
  // mode short-circuits to render nothing.
  if (!tourPasses) {
    return null
  }

  // If inside MultiTourKitProvider, register and render nothing
  if (registryContext) {
    return <TourRegistrar tour={tour} registryContext={registryContext} />
  }

  // Standalone mode: create own provider with UI
  return (
    <TourProvider tours={[tour]}>
      {content}
      <TourOverlay />
      <TourCard />
    </TourProvider>
  )
}

// Separate component to handle registration lifecycle
function TourRegistrar({
  tour,
  registryContext,
}: {
  tour: TourType
  registryContext: {
    registerTour: (t: TourType) => void
    unregisterTour: (id: string) => void
  }
}) {
  const { registerTour, unregisterTour } = registryContext

  // Register on mount and whenever the tour object changes.
  // Capture id at effect time so an id change correctly unregisters the previous tour.
  React.useEffect(() => {
    const id = tour.id
    registerTour(tour)
    return () => unregisterTour(id)
  }, [tour, registerTour, unregisterTour])

  // Render nothing - tour is registered in context
  return null
}
