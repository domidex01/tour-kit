import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Hotspot variants for HintHotspot
 */
export const hintHotspotVariants = cva(
  'fixed rounded-full border-2 border-background shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        default: 'h-3 w-3',
        sm: 'h-2.5 w-2.5',
        lg: 'h-4 w-4',
      },
      color: {
        default: 'bg-primary',
        secondary: 'bg-secondary-foreground',
        destructive: 'bg-destructive',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
      },
      pulse: {
        true: 'animate-tour-pulse',
        false: '',
      },
      zIndex: {
        default: 'z-50',
        high: 'z-[9999]',
      },
      // Named preset variants — Phase 3 of v2 package polish. The un-variant
      // path (variant undefined) renders the legacy dot byte-identical to v1.
      variant: {
        badge:
          'h-6 w-6 min-h-6 min-w-6 flex items-center justify-center text-[11px] font-semibold text-primary-foreground bg-primary',
        'beacon-with-label':
          'inline-flex items-center gap-1.5 min-h-6 min-w-6 bg-transparent border-transparent shadow-none',
        'what-s-new-pill':
          'inline-flex items-center gap-1 h-auto w-auto min-h-6 min-w-6 px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground bg-primary',
      },
    },
    compoundVariants: [
      {
        pulse: true,
        className: 'animate-tour-pulse',
      },
      // When a named variant is active, neutralise the `size` defaults so the
      // variant's own size/shape utilities win. The base un-variant render path
      // is untouched because `variant` is undefined by default.
      { variant: 'badge', size: 'default', className: '!h-6 !w-6' },
      { variant: 'badge', size: 'sm', className: '!h-6 !w-6' },
      { variant: 'badge', size: 'lg', className: '!h-6 !w-6' },
      { variant: 'beacon-with-label', size: 'default', className: '!h-auto !w-auto' },
      { variant: 'beacon-with-label', size: 'sm', className: '!h-auto !w-auto' },
      { variant: 'beacon-with-label', size: 'lg', className: '!h-auto !w-auto' },
      { variant: 'what-s-new-pill', size: 'default', className: '!h-auto !w-auto' },
      { variant: 'what-s-new-pill', size: 'sm', className: '!h-auto !w-auto' },
      { variant: 'what-s-new-pill', size: 'lg', className: '!h-auto !w-auto' },
    ],
    defaultVariants: {
      size: 'default',
      color: 'default',
      pulse: true,
      zIndex: 'default',
    },
  }
)

/** Stable string-literal union for the named hotspot presets. */
export type HintHotspotVariantName = 'badge' | 'beacon-with-label' | 'what-s-new-pill'

export type HintHotspotVariants = VariantProps<typeof hintHotspotVariants>

/**
 * Tooltip variants for HintTooltip
 */
export const hintTooltipVariants = cva(
  'rounded-lg border bg-popover text-popover-foreground shadow-md',
  {
    variants: {
      size: {
        default: 'max-w-[280px] p-3 text-sm',
        sm: 'max-w-[200px] p-2 text-xs',
        lg: 'max-w-[360px] p-4 text-base',
      },
      zIndex: {
        default: 'z-50',
        high: 'z-[9999]',
      },
    },
    defaultVariants: {
      size: 'default',
      zIndex: 'default',
    },
  }
)

export type HintTooltipVariants = VariantProps<typeof hintTooltipVariants>

/**
 * Close button variants for hints
 */
export const hintCloseVariants = cva(
  'absolute rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  {
    variants: {
      position: {
        default: 'right-2 top-2',
        inside: 'right-1 top-1',
      },
      size: {
        default: 'h-4 w-4',
        sm: 'h-3 w-3',
      },
    },
    defaultVariants: {
      position: 'default',
      size: 'default',
    },
  }
)

export type HintCloseVariants = VariantProps<typeof hintCloseVariants>
