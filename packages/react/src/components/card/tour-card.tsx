'use client'

import {
  type Placement as FloatingPlacement,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import { type Placement, useFocusTrap, useTour } from '@tour-kit/core'
import * as React from 'react'
import { cn } from '../../lib/utils'
import { TourArrow } from '../primitives/tour-arrow'
import { TourPortal } from '../primitives/tour-portal'
import { type TourCardVariants, tourCardVariants } from '../ui/card-variants'
import { TourCardContent } from './tour-card-content'
import { TourCardFooter } from './tour-card-footer'
import { TourCardHeader } from './tour-card-header'

// Map our Placement type to floating-ui Placement
function toFloatingPlacement(placement?: Placement): FloatingPlacement {
  if (!placement) return 'bottom'
  return placement.replace('-center', '') as FloatingPlacement
}

export interface TourCardProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'content'>,
    TourCardVariants {}

/**
 * TourCard - The main tour step card component
 *
 * Displays the current tour step with title, content, navigation, and progress.
 * Follows shadcn/ui patterns and can be customized via variants and className.
 *
 * @example
 * // Basic usage (automatically positioned by useTour)
 * <TourCard />
 *
 * @example
 * // With size variant
 * <TourCard size="lg" />
 *
 * @example
 * // With custom className
 * <TourCard className="my-custom-class" />
 *
 * @see {@link TourCardProps} for available props
 * @see {@link tourCardVariants} for available variants
 */
export const TourCard = React.forwardRef<HTMLDivElement, TourCardProps>(
  ({ className, size, ...props }, ref) => {
    const {
      isActive,
      currentStep,
      currentStepIndex,
      totalSteps,
      next,
      prev,
      skip,
      isFirstStep,
      isLastStep,
    } = useTour()

    const arrowRef = React.useRef<SVGSVGElement>(null)
    const { containerRef, activate, deactivate } = useFocusTrap(isActive)

    const targetElement = React.useMemo(() => {
      if (!currentStep?.target) return null
      if (typeof currentStep.target === 'string') {
        return document.querySelector<HTMLElement>(currentStep.target)
      }
      return currentStep.target.current
    }, [currentStep?.target])

    const { refs, floatingStyles, context } = useFloating({
      open: isActive,
      placement: toFloatingPlacement(currentStep?.placement),
      middleware: [
        offset(currentStep?.offset?.[1] ?? 12),
        flip({ fallbackAxisSideDirection: 'start' }),
        shift({ padding: 8 }),
        arrow({ element: arrowRef }),
      ],
      whileElementsMounted: autoUpdate,
    })

    React.useEffect(() => {
      if (targetElement) {
        refs.setReference(targetElement)
      }
    }, [targetElement, refs])

    React.useEffect(() => {
      if (isActive) {
        activate()
      } else {
        deactivate()
      }
    }, [isActive, activate, deactivate])

    if (!isActive || !currentStep) return null

    const showNavigation = currentStep.showNavigation ?? true
    const showClose = currentStep.showClose ?? true
    const showProgress = currentStep.showProgress ?? true

    return (
      <TourPortal>
        <div
          ref={(node) => {
            refs.setFloating(node)
            if (containerRef) {
              containerRef.current = node
            }
            // Forward the ref
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          style={floatingStyles}
          className={cn(tourCardVariants({ size }), 'z-50', currentStep.className, className)}
          // biome-ignore lint/a11y/useSemanticElements: Native dialog has default centering/backdrop incompatible with floating-ui
          role="dialog"
          aria-modal="true"
          aria-labelledby={`tour-step-title-${currentStep.id}`}
          {...props}
        >
          <TourCardHeader
            title={currentStep.title}
            titleId={`tour-step-title-${currentStep.id}`}
            showClose={showClose}
          />

          <TourCardContent content={currentStep.content} />

          <TourCardFooter
            currentStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            showNavigation={showNavigation}
            showProgress={showProgress}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onPrev={prev}
            onNext={next}
            onSkip={skip}
          />

          <TourArrow ref={arrowRef} context={context} />
        </div>
      </TourPortal>
    )
  }
)
TourCard.displayName = 'TourCard'
