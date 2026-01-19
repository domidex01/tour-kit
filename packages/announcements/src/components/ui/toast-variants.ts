import { cva } from 'class-variance-authority'

export const toastContainerVariants = cva('fixed z-50 flex flex-col gap-2 p-4', {
  variants: {
    position: {
      'top-left': 'top-0 left-0 items-start',
      'top-right': 'top-0 right-0 items-end',
      'top-center': 'top-0 left-1/2 -translate-x-1/2 items-center',
      'bottom-left': 'bottom-0 left-0 items-start',
      'bottom-right': 'bottom-0 right-0 items-end',
      'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 items-center',
    },
  },
  defaultVariants: {
    position: 'bottom-right',
  },
})

export const toastVariants = cva(
  'relative flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  {
    variants: {
      intent: {
        info: 'bg-background text-foreground border-border',
        success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800',
        warning: 'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800',
        error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
      },
      position: {
        'top-left': 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        'top-right': 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        'top-center': 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        'bottom-left': 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        'bottom-right': 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        'bottom-center': 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      },
    },
    defaultVariants: {
      intent: 'info',
      position: 'bottom-right',
    },
  }
)

export const toastProgressVariants = cva('absolute bottom-0 left-0 h-1 rounded-b-lg transition-all', {
  variants: {
    intent: {
      info: 'bg-primary',
      success: 'bg-green-600 dark:bg-green-400',
      warning: 'bg-yellow-600 dark:bg-yellow-400',
      error: 'bg-red-600 dark:bg-red-400',
    },
  },
  defaultVariants: {
    intent: 'info',
  },
})
