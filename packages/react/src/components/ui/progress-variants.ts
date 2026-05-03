import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Progress indicator variants
 */
export const tourProgressVariants = cva('', {
  variants: {
    variant: {
      text: 'text-sm text-muted-foreground',
      narrow: 'h-0.5 w-12 overflow-hidden rounded-full bg-secondary',
      bar: 'h-1.5 w-20 overflow-hidden rounded-full bg-secondary',
      chain: 'flex items-center gap-1',
      dots: 'flex gap-1',
      numbered: 'inline-flex items-center gap-1 text-sm',
      none: '',
    },
  },
  defaultVariants: {
    variant: 'dots',
  },
})

export type TourProgressVariants = VariantProps<typeof tourProgressVariants>

/**
 * Progress dot variants
 */
export const tourProgressDotVariants = cva('rounded-full transition-colors', {
  variants: {
    size: {
      default: 'h-2 w-2',
      sm: 'h-1.5 w-1.5',
      lg: 'h-2.5 w-2.5',
    },
    active: {
      true: 'bg-primary',
      false: 'bg-muted',
    },
  },
  defaultVariants: {
    size: 'default',
    active: false,
  },
})

export type TourProgressDotVariants = VariantProps<typeof tourProgressDotVariants>
