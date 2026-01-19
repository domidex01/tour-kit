import { cva } from 'class-variance-authority'

export const spotlightOverlayVariants = cva(
  'fixed inset-0 z-40 pointer-events-none',
  {
    variants: {
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      visible: true,
    },
  }
)

export const spotlightContentVariants = cva(
  'z-50 w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  {
    variants: {
      placement: {
        top: 'data-[state=open]:slide-in-from-bottom-2',
        right: 'data-[state=open]:slide-in-from-left-2',
        bottom: 'data-[state=open]:slide-in-from-top-2',
        left: 'data-[state=open]:slide-in-from-right-2',
      },
    },
    defaultVariants: {
      placement: 'bottom',
    },
  }
)
