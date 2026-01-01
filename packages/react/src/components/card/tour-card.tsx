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
  /** Use CSS variables instead of Tailwind classes */
  unstyled?: boolean
}

export function TourCard({ className, unstyled = false }: TourCardProps) {
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

  // CSS variable-based styles (works without Tailwind)
  const cssVarStyles: React.CSSProperties = unstyled
    ? {}
    : {
        zIndex: 'var(--tour-z-card, 9999)',
        width: 'var(--tour-card-width, 20rem)',
        padding: 'var(--tour-card-padding, 1rem)',
        backgroundColor: 'var(--tour-card-bg, #ffffff)',
        color: 'var(--tour-card-fg, #171717)',
        border: '1px solid var(--tour-card-border, #e5e7eb)',
        borderRadius: 'var(--tour-card-radius, 0.5rem)',
        boxShadow: 'var(--tour-card-shadow, 0 10px 15px -3px rgb(0 0 0 / 0.1))',
        fontFamily: 'var(--tour-font-family, inherit)',
        fontSize: 'var(--tour-font-size, 0.875rem)',
        lineHeight: 'var(--tour-line-height, 1.5)',
      }

  return (
    <TourPortal>
      <div
        ref={(node) => {
          refs.setFloating(node)
          if (containerRef) {
            ;(containerRef as React.MutableRefObject<HTMLElement | null>).current = node
          }
        }}
        style={{ ...floatingStyles, ...cssVarStyles }}
        className={cn(
          // Only apply Tailwind classes if not unstyled
          !unstyled &&
            'z-50 w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg',
          currentStep.className,
          className
        )}
        // biome-ignore lint/a11y/useSemanticElements: Using div for floating-ui positioning compatibility
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-step-title-${currentStep.id}`}
      >
        <TourCardHeader
          title={currentStep.title}
          titleId={`tour-step-title-${currentStep.id}`}
          showClose={showClose}
          unstyled={unstyled}
        />

        <TourCardContent content={currentStep.content} unstyled={unstyled} />

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
          unstyled={unstyled}
        />

        <TourArrow ref={arrowRef} context={context} />
      </div>
    </TourPortal>
  )
}
