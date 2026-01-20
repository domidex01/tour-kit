import { cva } from 'class-variance-authority'

export const bannerVariants = cva(
  'relative flex items-center justify-between gap-4 px-4 py-3 text-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  {
    variants: {
      position: {
        top: 'border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      },
      intent: {
        info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
        success:
          'bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800',
        warning:
          'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800',
        error:
          'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
        neutral: 'bg-background text-foreground border-border',
      },
      sticky: {
        true: 'fixed left-0 right-0 z-50',
        false: 'relative',
      },
    },
    compoundVariants: [
      {
        position: 'top',
        sticky: true,
        className: 'top-0',
      },
      {
        position: 'bottom',
        sticky: true,
        className: 'bottom-0',
      },
    ],
    defaultVariants: {
      position: 'top',
      intent: 'info',
      sticky: false,
    },
  }
)
