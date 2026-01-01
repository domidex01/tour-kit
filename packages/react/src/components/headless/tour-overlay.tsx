import { usePrefersReducedMotion, useSpotlight, useTour } from '@tour-kit/core'
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

  const renderProps: TourOverlayRenderProps = {
    isActive,
    overlayStyle,
    cutoutStyle,
    targetRect,
    interactive: currentStep?.interactive ?? false,
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
              pointerEvents: currentStep?.interactive ? 'auto' : 'none',
              ...customCutoutStyle,
            }}
          />
        )}
      </div>
    </TourPortal>
  )
}
