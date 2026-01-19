'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { buildYouTubeEmbedUrl } from '../../utils/embed-urls'
import {
  type MediaContainerVariants,
  iframeVariants,
  mediaContainerVariants,
} from '../ui/media-variants'

export interface YouTubeEmbedProps extends MediaContainerVariants {
  /** YouTube video ID */
  videoId: string
  /** Accessible title for the iframe */
  title: string
  /** Auto-play the video (requires muted=true in most browsers) */
  autoplay?: boolean
  /** Mute the video */
  muted?: boolean
  /** Show player controls */
  controls?: boolean
  /** Loop the video */
  loop?: boolean
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
 * YouTube embed component using youtube-nocookie.com for GDPR compliance
 */
export const YouTubeEmbed = React.forwardRef<HTMLIFrameElement, YouTubeEmbedProps>(
  (
    {
      videoId,
      title,
      autoplay = false,
      muted = false,
      controls = true,
      loop = false,
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
        buildYouTubeEmbedUrl(videoId, {
          autoplay,
          muted,
          controls,
          loop,
          startTime,
        }),
      [videoId, autoplay, muted, controls, loop, startTime]
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
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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

YouTubeEmbed.displayName = 'YouTubeEmbed'
