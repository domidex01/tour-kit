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
import { isVisibleStep, type Placement, resolveTarget, useFocusTrap, useTour } from '@tour-kit/core'
import * as React from 'react'
import { TourPortal } from '../primitives/tour-portal'

function toFloatingPlacement(placement?: Placement): FloatingPlacement {
  if (!placement) return 'bottom'
  return placement.replace('-center', '') as FloatingPlacement
}

export interface TourCardHeadlessProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  /** Render prop for custom rendering */
  render?: (props: TourCardRenderProps) => React.ReactNode
}

export interface TourCardRenderProps {
  isActive: boolean
  currentStep: ReturnType<typeof useTour>['currentStep']
  currentStepIndex: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  next: () => void
  prev: () => void
  skip: () => void
  floatingStyles: React.CSSProperties
  refs: {
    setFloating: (node: HTMLElement | null) => void
  }
  arrowRef: React.RefObject<SVGSVGElement | null>
  context: ReturnType<typeof useFloating>['context']
}

export function TourCardHeadless({ className, style, children, render }: TourCardHeadlessProps) {
  const tour = useTour()
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
  } = tour

  const arrowRef = React.useRef<SVGSVGElement>(null)
  const { containerRef, activate, deactivate } = useFocusTrap(isActive)

  // Phase 3 (refactor train) — narrow to the visible branch of the TourStep
  // discriminated union; hidden steps never render a card.
  const visibleStep =
    currentStep && isVisibleStep(currentStep) ? currentStep : null

  const targetElement = React.useMemo(() => {
    if (!visibleStep?.target) return null
    return resolveTarget(visibleStep.target)
  }, [visibleStep?.target])

  const { refs, floatingStyles, context } = useFloating({
    open: isActive,
    placement: toFloatingPlacement(visibleStep?.placement),
    middleware: [
      offset(visibleStep?.offset?.[1] ?? 12),
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

  if (!isActive || !visibleStep) return null

  const renderProps: TourCardRenderProps = {
    isActive,
    currentStep: visibleStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    next,
    prev,
    skip,
    floatingStyles,
    refs: { setFloating: refs.setFloating },
    arrowRef,
    context,
  }

  // If render prop is provided, use it
  if (render) {
    return <TourPortal>{render(renderProps)}</TourPortal>
  }

  // Default minimal rendering
  return (
    <TourPortal>
      <div
        ref={(node) => {
          refs.setFloating(node)
          if (containerRef) {
            containerRef.current = node
          }
        }}
        style={{ ...floatingStyles, ...style }}
        className={className}
        // biome-ignore lint/a11y/useSemanticElements: Using div for floating-ui positioning compatibility
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-step-title-${visibleStep.id}`}
      >
        {children}
      </div>
    </TourPortal>
  )
}
