'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import type { CaptionTrack, ResponsiveSource } from '../../types'
import { getSourceType, useResponsiveSource } from '../../utils/responsive'
import { type MediaContainerVariants, mediaContainerVariants } from '../ui/media-variants'

export interface NativeVideoProps extends MediaContainerVariants {
  /** Video source URL */
  src: string
  /** Accessible alternative text */
  alt: string
  /** Poster/thumbnail image URL */
  poster?: string
  /** Auto-play the video (requires muted=true in most browsers) */
  autoplay?: boolean
  /** Mute the video */
  muted?: boolean
  /** Show player controls */
  controls?: boolean
  /** Loop the video */
  loop?: boolean
  /** Play video inline on mobile (prevents fullscreen) */
  playsInline?: boolean
  /** Preload strategy */
  preload?: 'none' | 'metadata' | 'auto'
  /** Caption tracks */
  captions?: CaptionTrack[]
  /** Responsive sources for different breakpoints */
  sources?: ResponsiveSource[]
  /** Additional CSS class name */
  className?: string
  /** Callback when video starts playing */
  onPlay?: () => void
  /** Callback when video is paused */
  onPause?: () => void
  /** Callback when video ends */
  onEnded?: () => void
  /** Callback when video loads */
  onLoadedData?: () => void
  /** Callback on playback error */
  onError?: () => void
  /** Callback on time update */
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

/**
 * Native HTML5 video component with accessibility features
 */
export const NativeVideo = React.forwardRef<HTMLVideoElement, NativeVideoProps>(
  (
    {
      src,
      alt,
      poster,
      autoplay = false,
      muted = true,
      controls = true,
      loop = false,
      playsInline = true,
      preload = 'metadata',
      captions,
      sources,
      aspectRatio = '16/9',
      size = 'full',
      rounded = 'lg',
      className,
      onPlay,
      onPause,
      onEnded,
      onLoadedData,
      onError,
      onTimeUpdate,
    },
    ref
  ) => {
    const responsiveSrc = useResponsiveSource(sources, src)
    const videoRef = React.useRef<HTMLVideoElement>(null)

    // Merge refs
    const mergedRef = React.useMemo(() => {
      return (node: HTMLVideoElement | null) => {
        videoRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }
    }, [ref])

    const handleTimeUpdate = React.useCallback(() => {
      if (videoRef.current && onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration)
      }
    }, [onTimeUpdate])

    return (
      <div className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}>
        <video
          ref={mergedRef}
          src={responsiveSrc}
          poster={poster}
          autoPlay={autoplay}
          muted={muted}
          controls={controls}
          loop={loop}
          playsInline={playsInline}
          preload={preload}
          aria-label={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onLoadedData={onLoadedData}
          onError={onError}
          onTimeUpdate={onTimeUpdate ? handleTimeUpdate : undefined}
        >
          {/* Render responsive sources as source elements */}
          {sources?.map((source, index) => (
            <source
              key={`${source.src}-${index}`}
              src={source.src}
              type={source.type ?? getSourceType(source.src)}
              media={source.media}
            />
          ))}
          {/* Render caption tracks */}
          {captions?.map((track, index) => (
            <track
              key={`${track.srclang}-${index}`}
              src={track.src}
              kind="subtitles"
              srcLang={track.srclang}
              label={track.label}
              default={track.default}
            />
          ))}
          {/* Fallback message */}
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }
)

NativeVideo.displayName = 'NativeVideo'
