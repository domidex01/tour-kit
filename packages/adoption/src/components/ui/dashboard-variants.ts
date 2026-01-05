import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Dashboard container variants
 * Used by AdoptionDashboard component
 */
export const adoptionDashboardVariants = cva('', {
  variants: {
    spacing: {
      default: 'space-y-6',
      compact: 'space-y-4',
      none: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
})

export type AdoptionDashboardVariants = VariantProps<typeof adoptionDashboardVariants>

/**
 * Dashboard grid variants
 */
export const adoptionDashboardGridVariants = cva('grid gap-6', {
  variants: {
    layout: {
      default: 'grid-cols-1 lg:grid-cols-3',
      two: 'grid-cols-1 lg:grid-cols-2',
      single: 'grid-cols-1',
    },
  },
  defaultVariants: {
    layout: 'default',
  },
})

export type AdoptionDashboardGridVariants = VariantProps<typeof adoptionDashboardGridVariants>
