'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion'
import type { LottieOptions } from '../../types'
import { type MediaContainerVariants, mediaContainerVariants } from '../ui/media-variants'

export interface LottiePlayerProps extends MediaContainerVariants, LottieOptions {
  /** Lottie animation source URL (JSON or .lottie file) */
  src: string
  /** Accessible alternative text */
  alt: string
  /** Auto-play the animation (respects prefers-reduced-motion) */
  autoplay?: boolean
  /** Loop the animation */
  loop?: boolean
  /** Additional CSS class name */
  className?: string
  /** Callback when animation loads */
  onLoad?: () => void
  /** Callback on load error */
  onError?: () => void
}

/**
 * Lottie animation player component
 *
 * Note: This component uses dynamic import for @lottiefiles/react-lottie-player
 * which is an optional peer dependency. If the dependency is not installed,
 * a fallback placeholder will be shown.
 */
export const LottiePlayer = React.forwardRef<HTMLDivElement, LottiePlayerProps>(
  (
    {
      src,
      alt,
      autoplay = true,
      loop = true,
      speed = 1,
      direction = 1,
      renderer = 'svg',
      aspectRatio = '1/1',
      size = 'full',
      rounded = 'lg',
      className,
      onLoad,
      onError,
    },
    ref
  ) => {
    const [LottieComponent, setLottieComponent] = React.useState<React.ComponentType<{
      src: string
      autoplay?: boolean
      loop?: boolean
      speed?: number
      direction?: 1 | -1
      renderer?: 'svg' | 'canvas'
      onLoad?: () => void
      onError?: () => void
      style?: React.CSSProperties
    }> | null>(null)
    const [loadError, setLoadError] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)

    const prefersReducedMotion = usePrefersReducedMotion()

    // Dynamically import Lottie player
    React.useEffect(() => {
      let isMounted = true

      import('@lottiefiles/react-lottie-player')
        .then((module) => {
          if (isMounted) {
            // Use type assertion to handle the component type properly
            const Player = module.Player as React.ComponentType<{
              src: string
              autoplay?: boolean
              loop?: boolean
              speed?: number
              direction?: 1 | -1
              renderer?: 'svg' | 'canvas'
              onLoad?: () => void
              onError?: () => void
              style?: React.CSSProperties
            }>
            setLottieComponent(() => Player)
            setIsLoading(false)
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoadError(true)
            setIsLoading(false)
            onError?.()
          }
        })

      return () => {
        isMounted = false
      }
    }, [onError])

    // If reduced motion is preferred, show a static frame
    const shouldAnimate = !prefersReducedMotion

    // Show loading state
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
            <span className="sr-only">Loading animation...</span>
          </div>
        </div>
      )
    }

    // Show error/fallback if Lottie library not available
    if (loadError || !LottieComponent) {
      return (
        <div
          ref={ref}
          className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}
          role="img"
          aria-label={alt}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">Animation unavailable</span>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}
        role="img"
        aria-label={alt}
      >
        <LottieComponent
          src={src}
          autoplay={shouldAnimate && autoplay}
          loop={loop}
          speed={speed}
          direction={direction}
          renderer={renderer}
          onLoad={onLoad}
          onError={onError}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
          }}
        />
      </div>
    )
  }
)

LottiePlayer.displayName = 'LottiePlayer'
