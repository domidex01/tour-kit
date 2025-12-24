import { useTour } from '@tour-kit/core'
import { cn } from '../../utils/cn'

interface TourCloseProps {
  className?: string
  'aria-label'?: string
}

export function TourClose({ className, 'aria-label': ariaLabel = 'Close tour' }: TourCloseProps) {
  const { skip } = useTour()

  return (
    <button
      type="button"
      onClick={skip}
      className={cn(
        'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
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
