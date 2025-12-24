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
import { cn } from '../../utils/cn'
import { TourArrow } from '../primitives/tour-arrow'
import { TourPortal } from '../primitives/tour-portal'
import { TourCardContent } from './tour-card-content'
import { TourCardFooter } from './tour-card-footer'
import { TourCardHeader } from './tour-card-header'

// Map our Placement type to floating-ui Placement (center -> no suffix)
function toFloatingPlacement(placement?: Placement): FloatingPlacement {
  if (!placement) return 'bottom'
  // floating-ui uses 'top' instead of 'top-center', etc.
  return placement.replace('-center', '') as FloatingPlacement
}

interface TourCardProps {
  className?: string
}

export function TourCard({ className }: TourCardProps) {
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
            ;(containerRef as React.MutableRefObject<HTMLElement | null>).current = node
          }
        }}
        style={floatingStyles}
        className={cn(
          'z-50 w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg',
          currentStep.className,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-step-title-${currentStep.id}`}
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
