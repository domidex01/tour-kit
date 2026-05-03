import { cva } from 'class-variance-authority'

export const modalOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80 data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out-0 data-[state=open]:motion-safe:fade-in-0'
)

export const modalContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out-0 data-[state=open]:motion-safe:fade-in-0 data-[state=closed]:motion-safe:zoom-out-95 data-[state=open]:motion-safe:zoom-in-95 data-[state=closed]:motion-safe:slide-out-to-left-1/2 data-[state=closed]:motion-safe:slide-out-to-top-[48%] data-[state=open]:motion-safe:slide-in-from-left-1/2 data-[state=open]:motion-safe:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-[95vw] max-h-[95vh]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)
