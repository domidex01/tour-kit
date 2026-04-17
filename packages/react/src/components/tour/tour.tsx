'use client'

import { TourProvider, type TourStep as TourStepType, type Tour as TourType } from '@tour-kit/core'
import * as React from 'react'
import { TourCard } from '../card/tour-card'
import { TourOverlay } from '../overlay/tour-overlay'
import { useTourRegistryContextOptional } from '../provider/tourkit-provider'
import { TourStep } from './tour-step'

export interface TourProps {
  id: string
  autoStart?: boolean
  startAt?: number
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
  config,
  onStart,
  onComplete,
  onSkip,
  onStepChange,
  children,
}: TourProps) {
  const registryContext = useTourRegistryContextOptional()

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

  // Build tour config
  const tour: TourType = React.useMemo(
    () => ({
      id,
      steps,
      autoStart,
      startAt,
      ...config,
      onStart: onStart ? () => onStart() : undefined,
      onComplete: onComplete ? () => onComplete() : undefined,
      onSkip: onSkip ? () => onSkip() : undefined,
      onStepChange: onStepChange ? (step, index) => onStepChange(step, index) : undefined,
    }),
    [id, steps, autoStart, startAt, config, onStart, onComplete, onSkip, onStepChange]
  )

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
  const tourRef = React.useRef(tour)

  // Update ref when tour changes
  React.useEffect(() => {
    tourRef.current = tour
  }, [tour])

  React.useEffect(() => {
    registerTour(tourRef.current)
    return () => unregisterTour(tourRef.current.id)
  }, [registerTour, unregisterTour])

  // Re-register when tour config changes
  React.useEffect(() => {
    registerTour(tour)
  }, [tour, registerTour])

  // Render nothing - tour is registered in context
  return null
}
