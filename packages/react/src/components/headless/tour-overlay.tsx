'use client'

import {
  isVisibleStep,
  resolveTarget,
  usePrefersReducedMotion,
  useSpotlight,
  useTour,
} from '@tour-kit/core'
import * as React from 'react'
import { TourPortal } from '../primitives/tour-portal'

export interface TourOverlayHeadlessProps {
  className?: string
  style?: React.CSSProperties
  cutoutClassName?: string
  cutoutStyle?: React.CSSProperties
  onClick?: () => void
  /** Render prop for custom rendering */
  render?: (props: TourOverlayRenderProps) => React.ReactNode
}

export interface TourOverlayRenderProps {
  isActive: boolean
  overlayStyle: React.CSSProperties
  cutoutStyle: React.CSSProperties
  targetRect: DOMRect | null
  interactive: boolean
}

export function TourOverlayHeadless({
  className,
  style,
  cutoutClassName,
  cutoutStyle: customCutoutStyle,
  onClick,
  render,
}: TourOverlayHeadlessProps) {
  const { isActive, currentStep } = useTour()
  const { overlayStyle, cutoutStyle, show, hide, targetRect } = useSpotlight()
  const prefersReducedMotion = usePrefersReducedMotion()

  // Phase 3 (refactor train) — narrow to the visible branch of the TourStep
  // discriminated union; hidden steps have no spotlight settings.
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

  const renderProps: TourOverlayRenderProps = {
    isActive,
    overlayStyle,
    cutoutStyle,
    targetRect,
    interactive: visibleStep?.interactive ?? false,
  }

  if (render) {
    return <TourPortal>{render(renderProps)}</TourPortal>
  }

  return (
    <TourPortal>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Overlay is decorative and aria-hidden */}
      <div
        className={className}
        style={{ ...overlayStyle, ...style }}
        onClick={onClick}
        aria-hidden="true"
      >
        {targetRect && (
          <div
            className={cutoutClassName}
            style={{
              ...cutoutStyle,
              pointerEvents: visibleStep?.interactive ? 'auto' : 'none',
              ...customCutoutStyle,
            }}
          />
        )}
      </div>
    </TourPortal>
  )
}
