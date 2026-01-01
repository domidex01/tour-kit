import type * as React from 'react'
import { cn } from '../../utils/cn'

interface TourProgressProps {
  current: number
  total: number
  variant?: 'dots' | 'bar' | 'text'
  className?: string
  unstyled?: boolean
}

export function TourProgress({
  current,
  total,
  variant = 'dots',
  className,
  unstyled = false,
}: TourProgressProps) {
  const textStyles: React.CSSProperties = unstyled
    ? {}
    : {
        fontSize: 'var(--tour-font-size-sm, 0.75rem)',
        color: 'var(--tour-muted-fg, #737373)',
      }

  const barContainerStyles: React.CSSProperties = unstyled
    ? {}
    : {
        width: '5rem',
        height: '0.375rem',
        backgroundColor: 'var(--tour-card-border, #e5e7eb)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }

  const barFillStyles: React.CSSProperties = unstyled
    ? {}
    : {
        height: '100%',
        backgroundColor: 'var(--tour-primary, #6366f1)',
        transition:
          'width var(--tour-transition-duration, 200ms) var(--tour-transition-timing, ease-out)',
      }

  const dotsContainerStyles: React.CSSProperties = unstyled
    ? {}
    : {
        display: 'flex',
        gap: '0.25rem',
      }

  if (variant === 'text') {
    return (
      <span
        className={cn(!unstyled && 'text-sm text-muted-foreground', className)}
        style={textStyles}
      >
        {current} of {total}
      </span>
    )
  }

  if (variant === 'bar') {
    const percentage = (current / total) * 100
    return (
      <div
        className={cn(
          !unstyled && 'h-1.5 w-20 overflow-hidden rounded-full bg-secondary',
          className
        )}
        style={barContainerStyles}
      >
        <div
          className={cn(!unstyled && 'h-full bg-primary transition-all duration-300')}
          style={{ ...barFillStyles, width: `${percentage}%` }}
        />
      </div>
    )
  }

  return (
    <div className={cn(!unstyled && 'flex gap-1', className)} style={dotsContainerStyles}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i + 1 === current
        const dotStyles: React.CSSProperties = unstyled
          ? {}
          : {
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              backgroundColor: isActive
                ? 'var(--tour-primary, #6366f1)'
                : 'var(--tour-card-border, #e5e7eb)',
              transition:
                'background-color var(--tour-transition-duration, 200ms) var(--tour-transition-timing, ease-out)',
            }

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static progress dots never reorder
            key={i}
            className={cn(
              !unstyled && 'h-2 w-2 rounded-full transition-colors',
              !unstyled && (isActive ? 'bg-primary' : 'bg-secondary')
            )}
            style={dotStyles}
            data-active={isActive}
          />
        )
      })}
    </div>
  )
}
