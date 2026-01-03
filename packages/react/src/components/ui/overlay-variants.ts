import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Overlay variants for TourOverlay
 */
export const tourOverlayVariants = cva('fixed inset-0', {
  variants: {
    zIndex: {
      default: 'z-40',
      high: 'z-50',
      low: 'z-30',
    },
  },
  defaultVariants: {
    zIndex: 'default',
  },
})

export type TourOverlayVariants = VariantProps<typeof tourOverlayVariants>
