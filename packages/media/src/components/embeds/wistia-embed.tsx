'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { buildWistiaEmbedUrl } from '../../utils/embed-urls'
import {
  type MediaContainerVariants,
  iframeVariants,
  mediaContainerVariants,
} from '../ui/media-variants'

export interface WistiaEmbedProps extends MediaContainerVariants {
  /** Wistia video ID */
  videoId: string
  /** Accessible title for the iframe */
  title: string
  /** Auto-play the video */
  autoplay?: boolean
  /** Mute the video */
  muted?: boolean
  /** Loop the video */
  loop?: boolean
  /** Show player controls on load */
  controlsVisibleOnLoad?: boolean
  /** Start time in seconds */
  startTime?: number
  /** Additional CSS class name */
  className?: string
  /** Callback when iframe loads */
  onLoad?: () => void
  /** Callback when iframe fails to load */
  onError?: () => void
}

/**
 * Wistia embed component
 */
export const WistiaEmbed = React.forwardRef<HTMLIFrameElement, WistiaEmbedProps>(
  (
    {
      videoId,
      title,
      autoplay = false,
      muted = false,
      loop = false,
      controlsVisibleOnLoad = true,
      startTime,
      aspectRatio = '16/9',
      size = 'full',
      rounded = 'lg',
      className,
      onLoad,
      onError,
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(true)

    const embedUrl = React.useMemo(
      () =>
        buildWistiaEmbedUrl(videoId, {
          autoplay,
          muted,
          loop,
          controls: controlsVisibleOnLoad,
          startTime,
        }),
      [videoId, autoplay, muted, loop, controlsVisibleOnLoad, startTime]
    )

    const handleLoad = React.useCallback(() => {
      setIsLoading(false)
      onLoad?.()
    }, [onLoad])

    const handleError = React.useCallback(() => {
      setIsLoading(false)
      onError?.()
    }, [onError])

    return (
      <div className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
            <span className="sr-only">Loading video...</span>
          </div>
        )}
        <iframe
          ref={ref}
          src={embedUrl}
          title={title}
          allow="autoplay; fullscreen"
          allowFullScreen
          loading="lazy"
          className={cn(iframeVariants({ loading: isLoading }))}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    )
  }
)

WistiaEmbed.displayName = 'WistiaEmbed'
