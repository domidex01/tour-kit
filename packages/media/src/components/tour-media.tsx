'use client'

import * as React from 'react'
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion'
import { cn } from '../lib/utils'
import type { TourMediaProps } from '../types'
import { detectMediaType, parseMediaUrl } from '../utils/parse-media-url'
import { useResponsiveSource } from '../utils/responsive'
import {
  GifPlayer,
  LoomEmbed,
  LottiePlayer,
  NativeVideo,
  VimeoEmbed,
  WistiaEmbed,
  YouTubeEmbed,
} from './embeds'
import { type MediaContainerVariants, mediaContainerVariants } from './ui/media-variants'

export interface TourMediaComponentProps
  extends TourMediaProps,
    Omit<MediaContainerVariants, 'aspectRatio'> {}

/**
 * Main TourMedia component that auto-detects media type and renders
 * the appropriate embed component.
 *
 * Supports:
 * - YouTube (youtube-nocookie.com for GDPR compliance)
 * - Vimeo
 * - Loom
 * - Wistia
 * - Native video (mp4, webm, ogg)
 * - GIF with play/pause
 * - Lottie animations
 * - Images (fallback)
 *
 * @example
 * ```tsx
 * // Auto-detect from URL
 * <TourMedia
 *   src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   alt="Product demo"
 * />
 *
 * // Explicit type
 * <TourMedia
 *   src="/videos/demo.mp4"
 *   type="video"
 *   alt="Demo video"
 *   poster="/images/poster.jpg"
 * />
 * ```
 */
export const TourMedia = React.forwardRef<HTMLDivElement, TourMediaComponentProps>(
  (
    {
      src,
      type: explicitType,
      alt,
      poster,
      aspectRatio = '16/9',
      size = 'full',
      rounded = 'lg',
      autoplay = false,
      muted = true, // Default muted for autoplay compliance
      controls = true,
      loop = false,
      playsInline = true,
      startTime,
      captions,
      sources,
      lottieOptions,
      reducedMotionFallback,
      loading = 'lazy',
      preload = 'metadata',
      className,
      onLoaded,
      onPlay,
      onPause,
      onComplete,
      onError,
      onProgress,
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion()

    // Select responsive source
    const responsiveSrc = useResponsiveSource(sources, src)

    // Auto-detect media type if not explicitly provided
    const mediaType = explicitType ?? detectMediaType(responsiveSrc)
    const parsed = parseMediaUrl(responsiveSrc)

    // Show reduced motion fallback for animated content
    if (
      prefersReducedMotion &&
      reducedMotionFallback &&
      ['video', 'gif', 'lottie'].includes(mediaType)
    ) {
      return (
        <div
          ref={ref}
          className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}
        >
          <img
            src={reducedMotionFallback}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading={loading}
          />
        </div>
      )
    }

    // Render appropriate component based on media type
    switch (mediaType) {
      case 'youtube':
        return (
          <YouTubeEmbed
            videoId={parsed?.id ?? ''}
            title={alt}
            autoplay={autoplay}
            muted={muted}
            controls={controls}
            loop={loop}
            startTime={startTime}
            aspectRatio={aspectRatio}
            size={size}
            rounded={rounded}
            className={className}
            onLoad={onLoaded}
            onError={() => onError?.('Failed to load YouTube video')}
          />
        )

      case 'vimeo':
        return (
          <VimeoEmbed
            videoId={parsed?.id ?? ''}
            title={alt}
            autoplay={autoplay}
            muted={muted}
            loop={loop}
            startTime={startTime}
            aspectRatio={aspectRatio}
            size={size}
            rounded={rounded}
            className={className}
            onLoad={onLoaded}
            onError={() => onError?.('Failed to load Vimeo video')}
          />
        )

      case 'loom':
        return (
          <LoomEmbed
            videoId={parsed?.id ?? ''}
            title={alt}
            autoplay={autoplay}
            muted={muted}
            loop={loop}
            hideControls={!controls}
            startTime={startTime}
            aspectRatio={aspectRatio}
            size={size}
            rounded={rounded}
            className={className}
            onLoad={onLoaded}
            onError={() => onError?.('Failed to load Loom video')}
          />
        )

      case 'wistia':
        return (
          <WistiaEmbed
            videoId={parsed?.id ?? ''}
            title={alt}
            autoplay={autoplay}
            muted={muted}
            loop={loop}
            controlsVisibleOnLoad={controls}
            startTime={startTime}
            aspectRatio={aspectRatio}
            size={size}
            rounded={rounded}
            className={className}
            onLoad={onLoaded}
            onError={() => onError?.('Failed to load Wistia video')}
          />
        )

      case 'video':
        return (
          <NativeVideo
            src={responsiveSrc}
            alt={alt}
            poster={poster}
            autoplay={autoplay}
            muted={muted}
            controls={controls}
            loop={loop}
            playsInline={playsInline}
            preload={preload}
            captions={captions}
            sources={sources}
            aspectRatio={aspectRatio}
            size={size}
            rounded={rounded}
            className={className}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onComplete}
            onLoadedData={onLoaded}
            onError={() => onError?.('Failed to load video')}
            onTimeUpdate={onProgress}
          />
        )

      case 'gif':
        return (
          <GifPlayer
            src={responsiveSrc}
            alt={alt}
            poster={poster ?? reducedMotionFallback}
            autoplay={autoplay}
            aspectRatio={aspectRatio}
            size={size}
            rounded={rounded}
            className={className}
            onLoad={onLoaded}
            onError={() => onError?.('Failed to load GIF')}
          />
        )

      case 'lottie':
        return (
          <LottiePlayer
            src={responsiveSrc}
            alt={alt}
            autoplay={autoplay}
            loop={loop}
            speed={lottieOptions?.speed}
            direction={lottieOptions?.direction}
            renderer={lottieOptions?.renderer}
            aspectRatio={aspectRatio}
            size={size}
            rounded={rounded}
            className={className}
            onLoad={onLoaded}
            onError={() => onError?.('Failed to load Lottie animation')}
          />
        )
      default:
        return (
          <div
            ref={ref}
            className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}
          >
            <img
              src={responsiveSrc}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover"
              loading={loading}
              onLoad={onLoaded}
              onError={() => onError?.('Failed to load image')}
            />
          </div>
        )
    }
  }
)

TourMedia.displayName = 'TourMedia'
