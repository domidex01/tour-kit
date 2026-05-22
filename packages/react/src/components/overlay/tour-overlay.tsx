'use client'

import {
  isVisibleStep,
  resolveTarget,
  usePrefersReducedMotion,
  useSpotlight,
  useTour,
} from '@tour-kit/core'
import { cn } from '@tour-kit/core'
import * as React from 'react'
import { TourPortal } from '../primitives/tour-portal'
import { type TourOverlayVariants, tourOverlayVariants } from '../ui/overlay-variants'

export interface TourOverlayProps
  extends React.ComponentPropsWithoutRef<'div'>,
    TourOverlayVariants {
  /** Called when the overlay is clicked */
  onClick?: () => void
}

export const TourOverlay = React.forwardRef<HTMLDivElement, TourOverlayProps>(
  ({ className, zIndex, onClick, ...props }, ref) => {
    const { isActive, currentStep } = useTour()
    const { overlayStyle, cutoutStyle, show, hide, targetRect } = useSpotlight()
    const prefersReducedMotion = usePrefersReducedMotion()

    // Phase 3 (refactor train) — narrow to the visible branch of the TourStep
    // discriminated union; hidden steps have no target / spotlight settings.
    const visibleStep = currentStep && isVisibleStep(currentStep) ? currentStep : null

    const targetElement = React.useMemo(() => {
      if (!visibleStep?.target) return null
      return resolveTarget(visibleStep.target)
    }, [visibleStep?.target])

    React.useEffect(() => {
      if (isActive && targetElement) {
        show(targetElement, {
          padding: visibleStep?.spotlightPadding,
          borderRadius: visibleStep?.spotlightRadius,
          animate: !prefersReducedMotion,
        })
      } else {
        hide()
      }
    }, [isActive, targetElement, visibleStep, show, hide, prefersReducedMotion])

    if (!isActive) return null

    return (
      <TourPortal>
        <div
          ref={ref}
          className={cn(tourOverlayVariants({ zIndex }), className)}
          style={{
            ...overlayStyle,
            // When interactive, allow clicks to pass through the overlay to page elements
            pointerEvents: visibleStep?.interactive ? 'none' : overlayStyle.pointerEvents,
          }}
          onClick={onClick}
          aria-hidden="true"
          {...props}
        >
          {targetRect && (
            <div
              className="absolute bg-transparent"
              style={{
                ...cutoutStyle,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </TourPortal>
    )
  }
)
TourOverlay.displayName = 'TourOverlay'
