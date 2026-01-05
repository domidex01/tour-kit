import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Filter button variants
 * Used by AdoptionFilters for toggle buttons
 */
export const adoptionFilterButtonVariants = cva(
  'px-3 py-1 text-sm rounded-md border transition-colors',
  {
    variants: {
      active: {
        true: 'bg-primary text-primary-foreground border-primary',
        false: 'bg-background hover:bg-accent',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
)

export type AdoptionFilterButtonVariants = VariantProps<typeof adoptionFilterButtonVariants>

/**
 * Filter input variants
 * Used for search inputs in filters
 */
export const adoptionFilterInputVariants = cva(
  'w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      size: {
        default: 'h-10',
        sm: 'h-8 text-sm',
        lg: 'h-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export type AdoptionFilterInputVariants = VariantProps<typeof adoptionFilterInputVariants>

/**
 * Filter container variants
 */
export const adoptionFiltersVariants = cva('', {
  variants: {
    spacing: {
      default: 'space-y-4',
      compact: 'space-y-2',
      none: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
})

export type AdoptionFiltersVariants = VariantProps<typeof adoptionFiltersVariants>
