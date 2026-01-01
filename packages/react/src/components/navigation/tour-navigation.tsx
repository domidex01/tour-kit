import type * as React from 'react'
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
  unstyled?: boolean
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
  unstyled = false,
}: TourNavigationProps) {
  const containerStyles: React.CSSProperties = unstyled
    ? {}
    : {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }

  const skipStyles: React.CSSProperties = unstyled
    ? {}
    : {
        background: 'transparent',
        border: 'none',
        color: 'var(--tour-muted-fg, #737373)',
        cursor: 'pointer',
        padding: '0.25rem 0.5rem',
        fontSize: 'var(--tour-font-size, 0.875rem)',
        transition:
          'color var(--tour-transition-duration, 200ms) var(--tour-transition-timing, ease-out)',
      }

  const secondaryStyles: React.CSSProperties = unstyled
    ? {}
    : {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.375rem 0.75rem',
        fontSize: 'var(--tour-font-size, 0.875rem)',
        fontWeight: 500,
        borderRadius: 'calc(var(--tour-card-radius, 0.5rem) - 2px)',
        backgroundColor: 'var(--tour-secondary-bg, transparent)',
        color: 'var(--tour-secondary-fg, #171717)',
        border: '1px solid var(--tour-secondary-border, #e5e7eb)',
        cursor: 'pointer',
        transition:
          'background-color var(--tour-transition-duration, 200ms) var(--tour-transition-timing, ease-out)',
      }

  const primaryStyles: React.CSSProperties = unstyled
    ? {}
    : {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.375rem 0.75rem',
        fontSize: 'var(--tour-font-size, 0.875rem)',
        fontWeight: 500,
        borderRadius: 'calc(var(--tour-card-radius, 0.5rem) - 2px)',
        backgroundColor: 'var(--tour-primary, #6366f1)',
        color: 'var(--tour-primary-fg, #ffffff)',
        border: 'none',
        cursor: 'pointer',
        transition:
          'background-color var(--tour-transition-duration, 200ms) var(--tour-transition-timing, ease-out)',
      }

  return (
    <div className={cn(!unstyled && 'flex items-center gap-2', className)} style={containerStyles}>
      {onSkip && !isLastStep && (
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            !unstyled && 'text-sm text-muted-foreground hover:text-foreground transition-colors'
          )}
          style={skipStyles}
        >
          {skipLabel}
        </button>
      )}
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPrev}
          className={cn(
            !unstyled &&
              'inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors'
          )}
          style={secondaryStyles}
        >
          {prevLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className={cn(
          !unstyled &&
            'inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
        )}
        style={primaryStyles}
      >
        {isLastStep ? finishLabel : nextLabel}
      </button>
    </div>
  )
}
