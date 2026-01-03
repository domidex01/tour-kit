import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Progress indicator variants
 */
export const tourProgressVariants = cva('', {
  variants: {
    variant: {
      dots: 'flex gap-1',
      bar: 'h-1.5 w-20 overflow-hidden rounded-full bg-secondary',
      text: 'text-sm text-muted-foreground',
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
      false: 'bg-secondary',
    },
  },
  defaultVariants: {
    size: 'default',
    active: false,
  },
})

export type TourProgressDotVariants = VariantProps<typeof tourProgressDotVariants>
