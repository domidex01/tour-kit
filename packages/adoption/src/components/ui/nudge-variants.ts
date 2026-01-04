import { type VariantProps, cva } from 'class-variance-authority'

/**
 * AdoptionNudge variants following shadcn/ui patterns
 */
export const adoptionNudgeVariants = cva(
  'fixed rounded-lg border bg-popover text-popover-foreground shadow-lg z-50',
  {
    variants: {
      position: {
        'bottom-right': 'bottom-5 right-5',
        'bottom-left': 'bottom-5 left-5',
        'top-right': 'top-5 right-5',
        'top-left': 'top-5 left-5',
      },
      size: {
        default: 'max-w-[300px] p-4',
        sm: 'max-w-[240px] p-3',
        lg: 'max-w-[360px] p-5',
      },
    },
    defaultVariants: {
      position: 'bottom-right',
      size: 'default',
    },
  }
)

export type AdoptionNudgeVariants = VariantProps<typeof adoptionNudgeVariants>
