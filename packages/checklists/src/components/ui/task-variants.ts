import { type VariantProps, cva } from 'class-variance-authority'

/**
 * ChecklistTask variants following shadcn/ui patterns
 */
export const checklistTaskVariants = cva(
  'group flex items-start gap-3 rounded-lg transition-colors',
  {
    variants: {
      size: {
        default: 'p-3',
        sm: 'p-2',
        lg: 'p-4',
      },
      state: {
        default: 'cursor-pointer hover:bg-muted/50',
        completed: 'bg-muted/30 cursor-pointer hover:bg-muted/50',
        locked: 'opacity-50 cursor-not-allowed',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'default',
    },
  }
)

export type ChecklistTaskVariants = VariantProps<typeof checklistTaskVariants>

/**
 * Task checkbox variants
 */
export const taskCheckboxVariants = cva(
  'flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
  {
    variants: {
      size: {
        default: 'w-5 h-5',
        sm: 'w-4 h-4',
        lg: 'w-6 h-6',
      },
      state: {
        default: 'border-muted-foreground/30 hover:border-primary/50',
        completed: 'bg-primary border-primary text-primary-foreground',
        locked: 'border-muted-foreground/30 cursor-not-allowed',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'default',
    },
  }
)

export type TaskCheckboxVariants = VariantProps<typeof taskCheckboxVariants>

/**
 * Task title variants
 */
export const taskTitleVariants = cva('font-medium', {
  variants: {
    size: {
      default: 'text-sm',
      sm: 'text-xs',
      lg: 'text-base',
    },
    state: {
      default: '',
      completed: 'line-through text-muted-foreground',
      locked: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'default',
    state: 'default',
  },
})

export type TaskTitleVariants = VariantProps<typeof taskTitleVariants>

/**
 * Task description variants
 */
export const taskDescriptionVariants = cva('text-muted-foreground line-clamp-2', {
  variants: {
    size: {
      default: 'text-xs mt-0.5',
      sm: 'text-[10px] mt-0.5',
      lg: 'text-sm mt-1',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

export type TaskDescriptionVariants = VariantProps<typeof taskDescriptionVariants>
