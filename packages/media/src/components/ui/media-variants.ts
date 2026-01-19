import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Media container variants for aspect ratio and sizing
 */
export const mediaContainerVariants = cva('relative overflow-hidden rounded-lg bg-muted', {
  variants: {
    aspectRatio: {
      '16/9': 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '1/1': 'aspect-square',
      '9/16': 'aspect-[9/16]',
      '21/9': 'aspect-[21/9]',
      auto: '',
    },
    size: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'w-full',
    },
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    aspectRatio: '16/9',
    size: 'full',
    rounded: 'lg',
  },
})

export type MediaContainerVariants = VariantProps<typeof mediaContainerVariants>

/**
 * Media overlay variants for loading/error/play states
 */
export const mediaOverlayVariants = cva(
  'absolute inset-0 flex items-center justify-center transition-opacity',
  {
    variants: {
      state: {
        loading: 'bg-muted animate-pulse',
        error: 'bg-destructive/10',
        paused: 'bg-black/30',
        playing: 'opacity-0 pointer-events-none',
        idle: '',
      },
    },
    defaultVariants: {
      state: 'idle',
    },
  }
)

export type MediaOverlayVariants = VariantProps<typeof mediaOverlayVariants>

/**
 * Play button variants
 */
export const playButtonVariants = cva(
  'flex items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-10 w-10',
        md: 'h-14 w-14',
        lg: 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export type PlayButtonVariants = VariantProps<typeof playButtonVariants>

/**
 * Iframe embed variants
 */
export const iframeVariants = cva('absolute inset-0 h-full w-full border-0', {
  variants: {
    loading: {
      true: 'opacity-0',
      false: 'opacity-100',
    },
  },
  defaultVariants: {
    loading: false,
  },
})

export type IframeVariants = VariantProps<typeof iframeVariants>
