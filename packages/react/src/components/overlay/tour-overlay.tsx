import { usePrefersReducedMotion, useSpotlight, useTour } from '@tour-kit/core'
import * as React from 'react'
import { cn } from '../../utils/cn'
import { TourPortal } from '../primitives/tour-portal'

interface TourOverlayProps {
  className?: string
  onClick?: () => void
}

export function TourOverlay({ className, onClick }: TourOverlayProps) {
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
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Overlay is decorative and aria-hidden */}
      <div
        className={cn('fixed inset-0 z-40', className)}
        style={overlayStyle}
        onClick={onClick}
        aria-hidden="true"
      >
        {targetRect && (
          <div
            className="absolute bg-transparent"
            style={{
              ...cutoutStyle,
              pointerEvents: currentStep?.interactive ? 'auto' : 'none',
            }}
          />
        )}
      </div>
    </TourPortal>
  )
}
