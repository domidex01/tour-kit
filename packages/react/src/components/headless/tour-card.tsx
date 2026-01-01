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

  const renderProps: TourCardRenderProps = {
    isActive,
    currentStep,
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
            ;(containerRef as React.MutableRefObject<HTMLElement | null>).current = node
          }
        }}
        style={{ ...floatingStyles, ...style }}
        className={className}
        // biome-ignore lint/a11y/useSemanticElements: Using div for floating-ui positioning compatibility
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-step-title-${currentStep.id}`}
      >
        {children}
      </div>
    </TourPortal>
  )
}
