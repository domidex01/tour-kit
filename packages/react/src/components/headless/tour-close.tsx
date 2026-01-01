import { useTour } from '@tour-kit/core'
import type * as React from 'react'

export interface TourCloseHeadlessProps {
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
  children?: React.ReactNode
  onClick?: () => void
}

export function TourCloseHeadless({
  className,
  style,
  'aria-label': ariaLabel = 'Close tour',
  children,
  onClick,
}: TourCloseHeadlessProps) {
  const { skip } = useTour()

  const handleClick = () => {
    onClick?.()
    skip()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={style}
      aria-label={ariaLabel}
    >
      {children || (
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
      )}
    </button>
  )
}
