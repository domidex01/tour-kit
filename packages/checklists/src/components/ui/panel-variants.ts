import { type VariantProps, cva } from 'class-variance-authority'

/**
 * ChecklistPanel container variants following shadcn/ui patterns
 */
export const checklistPanelVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden',
  {
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
  }
)

export type ChecklistPanelVariants = VariantProps<typeof checklistPanelVariants>

/**
 * Panel header button variants
 */
export const panelHeaderVariants = cva('w-full flex items-center justify-between', {
  variants: {
    spacing: {
      default: 'p-4',
      compact: 'p-3',
    },
    collapsible: {
      true: 'hover:bg-muted/50 transition-colors cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    spacing: 'default',
    collapsible: true,
  },
})

export type PanelHeaderVariants = VariantProps<typeof panelHeaderVariants>

/**
 * Panel content transition variants
 */
export const panelContentVariants = cva('transition-all duration-200 ease-out overflow-hidden', {
  variants: {
    expanded: {
      true: 'max-h-[500px] opacity-100',
      false: 'max-h-0 opacity-0',
    },
  },
  defaultVariants: {
    expanded: true,
  },
})

export type PanelContentVariants = VariantProps<typeof panelContentVariants>

/**
 * Panel chevron variants
 */
export const panelChevronVariants = cva('text-muted-foreground transition-transform', {
  variants: {
    size: {
      default: 'w-5 h-5',
      sm: 'w-4 h-4',
      lg: 'w-6 h-6',
    },
    expanded: {
      true: 'rotate-180',
      false: '',
    },
  },
  defaultVariants: {
    size: 'default',
    expanded: false,
  },
})

export type PanelChevronVariants = VariantProps<typeof panelChevronVariants>
