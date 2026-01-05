import { type VariantProps, cva } from 'class-variance-authority'

/**
 * NewFeatureBadge variants following shadcn/ui patterns
 */
export const newFeatureBadgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
      size: {
        default: 'px-4 py-1 text-xs',
        sm: 'px-3 py-0.5 text-[10px]',
        lg: 'px-5 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type NewFeatureBadgeVariants = VariantProps<typeof newFeatureBadgeVariants>

/**
 * Adoption status badge variants
 * Used by AdoptionStatusBadge component
 */
export const adoptionStatusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      status: {
        adopted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        exploring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        churned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        not_started: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      },
    },
    defaultVariants: {
      status: 'not_started',
    },
  }
)

export type AdoptionStatusBadgeVariants = VariantProps<typeof adoptionStatusBadgeVariants>

/**
 * Premium badge variants
 * Used for premium feature indicators
 */
export const adoptionPremiumBadgeVariants = cva(
  'inline-flex items-center rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  {
    variants: {
      size: {
        default: 'px-2 py-0.5',
        sm: 'px-1.5 py-0.5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export type AdoptionPremiumBadgeVariants = VariantProps<typeof adoptionPremiumBadgeVariants>
