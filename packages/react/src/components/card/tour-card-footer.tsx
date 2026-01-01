import type * as React from 'react'
import { cn } from '../../utils/cn'
import { TourNavigation } from '../navigation/tour-navigation'
import { TourProgress } from '../navigation/tour-progress'

interface TourCardFooterProps {
  currentStep: number
  totalSteps: number
  showNavigation?: boolean
  showProgress?: boolean
  isFirstStep: boolean
  isLastStep: boolean
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
  className?: string
  unstyled?: boolean
}

export function TourCardFooter({
  currentStep,
  totalSteps,
  showNavigation = true,
  showProgress = true,
  isFirstStep,
  isLastStep,
  onPrev,
  onNext,
  onSkip,
  className,
  unstyled = false,
}: TourCardFooterProps) {
  const cssVarStyles: React.CSSProperties = unstyled
    ? {}
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.5rem',
      }

  return (
    <div
      className={cn(!unstyled && 'flex items-center justify-between pt-2', className)}
      style={cssVarStyles}
    >
      {showProgress && (
        <TourProgress current={currentStep} total={totalSteps} unstyled={unstyled} />
      )}
      {showNavigation && (
        <TourNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrev={onPrev}
          onNext={onNext}
          onSkip={onSkip}
          unstyled={unstyled}
        />
      )}
    </div>
  )
}
