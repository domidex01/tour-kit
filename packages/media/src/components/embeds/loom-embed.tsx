'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { buildLoomEmbedUrl } from '../../utils/embed-urls'
import {
  type MediaContainerVariants,
  iframeVariants,
  mediaContainerVariants,
} from '../ui/media-variants'

export interface LoomEmbedProps extends MediaContainerVariants {
  /** Loom video ID */
  videoId: string
  /** Accessible title for the iframe */
  title: string
  /** Auto-play the video */
  autoplay?: boolean
  /** Mute the video */
  muted?: boolean
  /** Loop the video */
  loop?: boolean
  /** Hide player controls */
  hideControls?: boolean
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
 * Loom embed component
 */
export const LoomEmbed = React.forwardRef<HTMLIFrameElement, LoomEmbedProps>(
  (
    {
      videoId,
      title,
      autoplay = false,
      muted = false,
      loop = false,
      hideControls = false,
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
        buildLoomEmbedUrl(videoId, {
          autoplay,
          muted,
          loop,
          controls: !hideControls,
          startTime,
        }),
      [videoId, autoplay, muted, loop, hideControls, startTime]
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

LoomEmbed.displayName = 'LoomEmbed'
