import { type VariantProps, cva } from 'class-variance-authority'

/**
 * ChecklistProgress container variants following shadcn/ui patterns
 */
export const checklistProgressVariants = cva('flex items-center gap-2', {
  variants: {
    size: {
      default: '',
      sm: 'gap-1.5',
      lg: 'gap-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export type ChecklistProgressVariants = VariantProps<typeof checklistProgressVariants>

/**
 * Progress track variants
 */
export const progressTrackVariants = cva('flex-1 bg-muted rounded-full overflow-hidden', {
  variants: {
    size: {
      default: 'h-2',
      sm: 'h-1.5',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export type ProgressTrackVariants = VariantProps<typeof progressTrackVariants>

/**
 * Progress bar variants
 */
export const progressBarVariants = cva('h-full transition-all duration-300 ease-out', {
  variants: {
    variant: {
      default: 'bg-primary',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      destructive: 'bg-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type ProgressBarVariants = VariantProps<typeof progressBarVariants>

/**
 * Progress text variants
 */
export const progressTextVariants = cva('text-muted-foreground', {
  variants: {
    size: {
      default: 'text-sm',
      sm: 'text-xs',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export type ProgressTextVariants = VariantProps<typeof progressTextVariants>
