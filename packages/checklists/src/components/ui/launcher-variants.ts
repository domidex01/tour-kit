import { type VariantProps, cva } from 'class-variance-authority'

/**
 * ChecklistLauncher button variants following shadcn/ui patterns
 */
export const checklistLauncherVariants = cva(
  'relative flex items-center justify-center rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      size: {
        default: 'w-14 h-14',
        sm: 'w-12 h-12',
        lg: 'w-16 h-16',
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export type ChecklistLauncherVariants = VariantProps<typeof checklistLauncherVariants>

/**
 * Launcher badge variants
 */
export const launcherBadgeVariants = cva(
  'absolute flex items-center justify-center font-bold rounded-full',
  {
    variants: {
      size: {
        default: '-top-1 -right-1 w-5 h-5 text-xs',
        sm: '-top-0.5 -right-0.5 w-4 h-4 text-[10px]',
        lg: '-top-1.5 -right-1.5 w-6 h-6 text-sm',
      },
      variant: {
        default: 'bg-destructive text-destructive-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-green-500 text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export type LauncherBadgeVariants = VariantProps<typeof launcherBadgeVariants>

/**
 * Launcher position variants
 */
export const launcherPositionVariants = cva('fixed z-50', {
  variants: {
    position: {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
    },
  },
  defaultVariants: {
    position: 'bottom-right',
  },
})

export type LauncherPositionVariants = VariantProps<typeof launcherPositionVariants>
