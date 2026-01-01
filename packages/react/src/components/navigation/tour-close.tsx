import { useTour } from '@tour-kit/core'
import type * as React from 'react'
import { cn } from '../../utils/cn'

interface TourCloseProps {
  className?: string
  'aria-label'?: string
  unstyled?: boolean
}

export function TourClose({
  className,
  'aria-label': ariaLabel = 'Close tour',
  unstyled = false,
}: TourCloseProps) {
  const { skip } = useTour()

  const cssVarStyles: React.CSSProperties = unstyled
    ? {}
    : {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.5rem',
        height: '1.5rem',
        padding: 0,
        background: 'transparent',
        border: 'none',
        borderRadius: 'calc(var(--tour-card-radius, 0.5rem) - 4px)',
        color: 'var(--tour-muted-fg, #737373)',
        cursor: 'pointer',
        opacity: 0.7,
        transition:
          'color var(--tour-transition-duration, 200ms) var(--tour-transition-timing, ease-out), opacity var(--tour-transition-duration, 200ms) var(--tour-transition-timing, ease-out)',
      }

  return (
    <button
      type="button"
      onClick={skip}
      className={cn(
        !unstyled &&
          'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      style={cssVarStyles}
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  )
}
