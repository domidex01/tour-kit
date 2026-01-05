import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Stat card variants for AdoptionStatCard component
 * Follows shadcn/ui Card patterns
 */
export const adoptionStatCardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export type AdoptionStatCardVariants = VariantProps<typeof adoptionStatCardVariants>

/**
 * Stat card trend variants
 * Used for trend indicators in stat cards
 */
export const adoptionStatTrendVariants = cva('mt-4 text-xs flex items-center gap-1', {
  variants: {
    direction: {
      up: 'text-green-600 dark:text-green-400',
      down: 'text-red-600 dark:text-red-400',
      neutral: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    direction: 'neutral',
  },
})

export type AdoptionStatTrendVariants = VariantProps<typeof adoptionStatTrendVariants>

/**
 * Stats grid variants
 * Used for AdoptionStatsGrid layout
 */
export const adoptionStatsGridVariants = cva('grid gap-4', {
  variants: {
    columns: {
      default: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      two: 'grid-cols-1 md:grid-cols-2',
      three: 'grid-cols-1 md:grid-cols-3',
      five: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    },
  },
  defaultVariants: {
    columns: 'default',
  },
})

export type AdoptionStatsGridVariants = VariantProps<typeof adoptionStatsGridVariants>
