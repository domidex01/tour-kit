import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Category chart container variants
 * Used by AdoptionCategoryChart component
 */
export const adoptionChartVariants = cva('', {
  variants: {
    spacing: {
      default: 'space-y-4',
      compact: 'space-y-2',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
})

export type AdoptionChartVariants = VariantProps<typeof adoptionChartVariants>

/**
 * Chart bar container variants
 */
export const adoptionChartBarContainerVariants = cva('rounded-full overflow-hidden', {
  variants: {
    size: {
      default: 'h-2',
      sm: 'h-1.5',
      lg: 'h-3',
    },
    background: {
      default: 'bg-muted',
      secondary: 'bg-secondary',
    },
  },
  defaultVariants: {
    size: 'default',
    background: 'default',
  },
})

export type AdoptionChartBarContainerVariants = VariantProps<
  typeof adoptionChartBarContainerVariants
>

/**
 * Chart bar fill variants
 */
export const adoptionChartBarFillVariants = cva('h-full transition-all', {
  variants: {
    color: {
      primary: 'bg-primary',
      success: 'bg-green-500 dark:bg-green-400',
      warning: 'bg-yellow-500 dark:bg-yellow-400',
      danger: 'bg-red-500 dark:bg-red-400',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
})

export type AdoptionChartBarFillVariants = VariantProps<typeof adoptionChartBarFillVariants>

/**
 * Chart heading variants
 */
export const adoptionChartHeadingVariants = cva('font-semibold', {
  variants: {
    size: {
      default: 'text-lg',
      sm: 'text-base',
      lg: 'text-xl',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export type AdoptionChartHeadingVariants = VariantProps<typeof adoptionChartHeadingVariants>
