import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Card variants for TourCard component
 * Follows shadcn/ui Card patterns
 */
export const tourCardVariants = cva(
  'rounded-lg border bg-popover text-popover-foreground shadow-lg',
  {
    variants: {
      size: {
        default: 'w-80 p-4',
        sm: 'w-64 p-3',
        lg: 'w-96 p-5',
        auto: 'w-auto p-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export type TourCardVariants = VariantProps<typeof tourCardVariants>

/**
 * Card header variants
 */
export const tourCardHeaderVariants = cva('flex items-start justify-between gap-2', {
  variants: {
    spacing: {
      default: '',
      compact: 'gap-1',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
})

export type TourCardHeaderVariants = VariantProps<typeof tourCardHeaderVariants>

/**
 * Card content variants
 */
export const tourCardContentVariants = cva('text-sm text-muted-foreground', {
  variants: {
    spacing: {
      default: 'py-3',
      compact: 'py-2',
      none: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
})

export type TourCardContentVariants = VariantProps<typeof tourCardContentVariants>

/**
 * Card footer variants
 */
export const tourCardFooterVariants = cva('flex items-center', {
  variants: {
    justify: {
      between: 'justify-between',
      end: 'justify-end',
      start: 'justify-start',
    },
    spacing: {
      default: 'pt-2',
      compact: 'pt-1',
      none: '',
    },
  },
  defaultVariants: {
    justify: 'between',
    spacing: 'default',
  },
})

export type TourCardFooterVariants = VariantProps<typeof tourCardFooterVariants>
