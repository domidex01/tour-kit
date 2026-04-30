'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion'
import {
  type MediaContainerVariants,
  mediaContainerVariants,
  playButtonVariants,
} from '../ui/media-variants'

export interface GifPlayerProps extends MediaContainerVariants {
  /** GIF source URL */
  src: string
  /** Accessible alternative text */
  alt: string
  /** Static poster image for paused state */
  poster?: string
  /** Auto-play the GIF (respects prefers-reduced-motion) */
  autoplay?: boolean
  /** Additional CSS class name */
  className?: string
  /** Callback when GIF loads */
  onLoad?: () => void
  /** Callback on load error */
  onError?: () => void
}

/**
 * GIF player component with play/pause control
 * Respects prefers-reduced-motion accessibility preference
 */
export const GifPlayer = React.forwardRef<HTMLImageElement, GifPlayerProps>(
  (
    {
      src,
      alt,
      poster,
      autoplay = true,
      aspectRatio = '16/9',
      size = 'full',
      rounded = 'lg',
      className,
      onLoad,
      onError,
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion()
    const [isPlaying, setIsPlaying] = React.useState(autoplay)
    const [isLoaded, setIsLoaded] = React.useState(false)

    // Pause whenever the user's reduced-motion preference becomes true
    React.useEffect(() => {
      if (prefersReducedMotion) {
        setIsPlaying(false)
      }
    }, [prefersReducedMotion])

    const handleLoad = React.useCallback(() => {
      setIsLoaded(true)
      onLoad?.()
    }, [onLoad])

    const togglePlayPause = React.useCallback(() => {
      setIsPlaying((prev) => !prev)
    }, [])

    // Determine which image to show
    const displaySrc = isPlaying ? src : (poster ?? src)

    return (
      <button
        type="button"
        className={cn(
          mediaContainerVariants({ aspectRatio, size, rounded }),
          'cursor-pointer appearance-none border-0 p-0 text-left',
          className
        )}
        onClick={togglePlayPause}
        aria-label={isPlaying ? `Pause ${alt}` : `Play ${alt}`}
        aria-pressed={isPlaying}
      >
        {/* Loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
            <span className="sr-only">Loading...</span>
          </div>
        )}

        {/* GIF/Poster image */}
        <img
          ref={ref}
          src={displaySrc}
          alt={alt}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={onError}
        />

        {/* Play/Pause overlay */}
        {!isPlaying && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className={cn(playButtonVariants({ size: 'md' }))}>
              <PlayIcon className="h-6 w-6 ml-0.5" />
            </div>
          </div>
        )}
      </button>
    )
  }
)

GifPlayer.displayName = 'GifPlayer'

/**
 * Simple play icon SVG
 */
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
        clipRule="evenodd"
      />
    </svg>
  )
}
