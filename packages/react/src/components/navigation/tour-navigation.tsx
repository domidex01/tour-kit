import { cn } from '../../utils/cn'

interface TourNavigationProps {
  isFirstStep: boolean
  isLastStep: boolean
  onPrev: () => void
  onNext: () => void
  onSkip?: () => void
  className?: string
  prevLabel?: string
  nextLabel?: string
  finishLabel?: string
  skipLabel?: string
}

export function TourNavigation({
  isFirstStep,
  isLastStep,
  onPrev,
  onNext,
  onSkip,
  className,
  prevLabel = 'Back',
  nextLabel = 'Next',
  finishLabel = 'Finish',
  skipLabel = 'Skip',
}: TourNavigationProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {onSkip && !isLastStep && (
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {skipLabel}
        </button>
      )}
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {prevLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {isLastStep ? finishLabel : nextLabel}
      </button>
    </div>
  )
}
