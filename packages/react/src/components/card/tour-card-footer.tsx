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
}: TourCardFooterProps) {
  return (
    <div className={cn('flex items-center justify-between pt-2', className)}>
      {showProgress && <TourProgress current={currentStep} total={totalSteps} />}
      {showNavigation && (
        <TourNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrev={onPrev}
          onNext={onNext}
          onSkip={onSkip}
        />
      )}
    </div>
  )
}
