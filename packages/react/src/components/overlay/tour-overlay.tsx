import { usePrefersReducedMotion, useSpotlight, useTour } from '@tour-kit/core'
import * as React from 'react'
import { cn } from '../../utils/cn'
import { TourPortal } from '../primitives/tour-portal'

interface TourOverlayProps {
  className?: string
  onClick?: () => void
  unstyled?: boolean
}

export function TourOverlay({ className, onClick, unstyled = false }: TourOverlayProps) {
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

  const cssVarStyles: React.CSSProperties = unstyled
    ? {}
    : {
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--tour-z-overlay, 9998)',
      }

  return (
    <TourPortal>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Overlay is decorative and aria-hidden */}
      <div
        className={cn(!unstyled && 'fixed inset-0 z-40', className)}
        style={{ ...overlayStyle, ...cssVarStyles }}
        onClick={onClick}
        aria-hidden="true"
      >
        {targetRect && (
          <div
            className={cn(!unstyled && 'absolute bg-transparent')}
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
