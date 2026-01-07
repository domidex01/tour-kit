import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Checklist container variants following shadcn/ui patterns
 */
export const checklistVariants = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
  variants: {
    size: {
      default: 'w-full',
      sm: 'max-w-xs',
      md: 'max-w-sm',
      lg: 'max-w-md',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export type ChecklistVariants = VariantProps<typeof checklistVariants>

/**
 * Checklist header variants
 */
export const checklistHeaderVariants = cva('flex items-center justify-between border-b', {
  variants: {
    spacing: {
      default: 'p-4',
      compact: 'p-3',
      none: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
})

export type ChecklistHeaderVariants = VariantProps<typeof checklistHeaderVariants>

/**
 * Checklist content/tasks container variants
 */
export const checklistContentVariants = cva('', {
  variants: {
    spacing: {
      default: 'p-2',
      compact: 'p-1',
      none: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
})

export type ChecklistContentVariants = VariantProps<typeof checklistContentVariants>

/**
 * Checklist complete state variants
 */
export const checklistCompleteVariants = cva('text-center border-t', {
  variants: {
    variant: {
      default: 'p-4 bg-muted/30',
      subtle: 'p-3 bg-muted/20',
      none: 'p-4',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type ChecklistCompleteVariants = VariantProps<typeof checklistCompleteVariants>
