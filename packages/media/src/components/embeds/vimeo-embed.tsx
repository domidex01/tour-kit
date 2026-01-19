'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import { buildVimeoEmbedUrl } from '../../utils/embed-urls'
import {
  type MediaContainerVariants,
  iframeVariants,
  mediaContainerVariants,
} from '../ui/media-variants'

export interface VimeoEmbedProps extends MediaContainerVariants {
  /** Vimeo video ID */
  videoId: string
  /** Accessible title for the iframe */
  title: string
  /** Auto-play the video (requires muted=true in most browsers) */
  autoplay?: boolean
  /** Mute the video */
  muted?: boolean
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
 * Vimeo embed component with privacy mode (dnt=1)
 */
export const VimeoEmbed = React.forwardRef<HTMLIFrameElement, VimeoEmbedProps>(
  (
    {
      videoId,
      title,
      autoplay = false,
      muted = false,
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
        buildVimeoEmbedUrl(videoId, {
          autoplay,
          muted,
          loop,
          startTime,
        }),
      [videoId, autoplay, muted, loop, startTime]
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
          allow="autoplay; fullscreen; picture-in-picture"
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

VimeoEmbed.displayName = 'VimeoEmbed'
