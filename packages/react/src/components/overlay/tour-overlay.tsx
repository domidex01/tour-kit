'use client'

import { usePrefersReducedMotion, useSpotlight, useTour } from '@tour-kit/core'
import * as React from 'react'
import { cn } from '../../lib/utils'
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

    const targetElement = React.useMemo(() => {
      if (!currentStep?.target) return null
      if (typeof currentStep.target === 'string') {
        return document.querySelector<HTMLElement>(currentStep.target)
      }
      return currentStep.target.current
    }, [currentStep?.target])

    React.useEffect(() => {
      if (isActive && targetElement) {
        show(targetElement, {
          padding: currentStep?.spotlightPadding,
          borderRadius: currentStep?.spotlightRadius,
          animate: !prefersReducedMotion,
        })
      } else {
        hide()
      }
    }, [isActive, targetElement, currentStep, show, hide, prefersReducedMotion])

    if (!isActive) return null

    return (
      <TourPortal>
        <div
          ref={ref}
          className={cn(tourOverlayVariants({ zIndex }), className)}
          style={{
            ...overlayStyle,
            // When interactive, allow clicks to pass through the overlay to page elements
            pointerEvents: currentStep?.interactive ? 'none' : overlayStyle.pointerEvents,
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
