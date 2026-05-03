import { cva } from 'class-variance-authority'

export const spotlightOverlayVariants = cva('fixed inset-0 z-40 pointer-events-none', {
  variants: {
    visible: {
      true: 'opacity-100',
      false: 'opacity-0',
    },
  },
  defaultVariants: {
    visible: true,
  },
})

export const spotlightContentVariants = cva(
  'z-50 w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out-0 data-[state=open]:motion-safe:fade-in-0 data-[state=closed]:motion-safe:zoom-out-95 data-[state=open]:motion-safe:zoom-in-95',
  {
    variants: {
      placement: {
        top: 'data-[state=open]:motion-safe:slide-in-from-bottom-2',
        right: 'data-[state=open]:motion-safe:slide-in-from-left-2',
        bottom: 'data-[state=open]:motion-safe:slide-in-from-top-2',
        left: 'data-[state=open]:motion-safe:slide-in-from-right-2',
      },
    },
    defaultVariants: {
      placement: 'bottom',
    },
  }
)
