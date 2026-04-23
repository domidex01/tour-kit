import { cva } from 'class-variance-authority'

export const bannerVariants = cva(
  'relative flex items-center justify-between gap-4 px-4 py-3 text-sm',
  {
    variants: {
      position: {
        top: 'border-b',
        bottom: 'border-t',
      },
      intent: {
        info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
        feedback: 'bg-background text-foreground border-border',
      },
      sticky: {
        true: 'fixed left-0 right-0 z-40',
        false: 'relative',
      },
    },
    compoundVariants: [
      { position: 'top', sticky: true, className: 'top-0' },
      { position: 'bottom', sticky: true, className: 'bottom-0' },
    ],
    defaultVariants: {
      position: 'top',
      intent: 'info',
      sticky: false,
    },
  }
)
