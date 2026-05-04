'use client'

import { useReducedMotion } from '@tour-kit/core'
import * as React from 'react'
import {
  type MediaSlotType,
  type ResolvedMediaSlotType,
  detectMediaSlotType,
} from '../lib/detect-media-type'
import type { AspectRatio } from '../types'
import {
  extractLoomId,
  extractVimeoId,
  extractWistiaId,
  extractYouTubeId,
} from '../utils/extract-video-id'
import {
  GifPlayer,
  LoomEmbed,
  LottiePlayer,
  NativeVideo,
  VimeoEmbed,
  WistiaEmbed,
  YouTubeEmbed,
} from './embeds'

export type { MediaSlotType, ResolvedMediaSlotType } from '../lib/detect-media-type'

export interface MediaSlotProps {
  /** Media source URL (or path for native files). */
  src: string
  /** Explicit type override; defaults to `'auto'` (URL-pattern detection). */
  type?: MediaSlotType
  /** Poster / static fallback image. Honored by GIF and used as Lottie fallback under reduced motion. */
  poster?: string
  /** Display aspect ratio for the surrounding container. */
  aspectRatio?: AspectRatio
  /** Extra class name forwarded to the rendered embed. */
  className?: string
  /** Accessible alternative text. Required for `<img>` fallback; reused as iframe `title` when set. */
  alt?: string
  /** Optional explicit accessible iframe title (overrides `alt` for iframe embeds). */
  title?: string
  /** Auto-play the embedded media. Always suppressed under `prefers-reduced-motion: reduce`. */
  autoplay?: boolean
  /** Loop playback (where supported). */
  loop?: boolean
  /** Mute audio (required for autoplay in most browsers). */
  muted?: boolean
}

interface ErrorFallbackProps {
  url: string
  provider: ResolvedMediaSlotType
  className?: string
}

const PROVIDER_LABELS: Record<ResolvedMediaSlotType, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  loom: 'Loom',
  wistia: 'Wistia',
  video: 'video',
  gif: 'image',
  lottie: 'animation',
  image: 'image',
}

const IFRAME_PROVIDERS = new Set<ResolvedMediaSlotType>(['youtube', 'vimeo', 'loom', 'wistia'])

const MediaErrorFallback: React.FC<ErrorFallbackProps> = ({ url, provider, className }) => {
  const label = PROVIDER_LABELS[provider] ?? provider
  return (
    <div
      role="alert"
      className={className}
      data-tk-media-fallback
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid currentColor',
        textAlign: 'center',
      }}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        Watch on {label}
      </a>
    </div>
  )
}

function extractEmbedId(src: string, provider: ResolvedMediaSlotType): string {
  switch (provider) {
    case 'youtube':
      return extractYouTubeId(src) ?? ''
    case 'vimeo':
      return extractVimeoId(src) ?? ''
    case 'loom':
      return extractLoomId(src) ?? ''
    case 'wistia':
      return extractWistiaId(src) ?? ''
    default:
      return ''
  }
}

interface DispatchProps {
  resolved: ResolvedMediaSlotType
  src: string
  alt?: string
  title?: string
  poster?: string
  aspectRatio?: AspectRatio
  className?: string
  autoplay: boolean
  loop: boolean
  muted: boolean
  onIframeError: () => void
  prefersReducedMotion: boolean
}

function renderDispatch(props: DispatchProps): React.ReactElement {
  const {
    resolved,
    src,
    alt,
    title,
    poster,
    aspectRatio,
    className,
    autoplay,
    loop,
    muted,
    onIframeError,
    prefersReducedMotion,
  } = props
  const a11yTitle = title ?? alt ?? 'Embedded media'
  const safeAutoplay = autoplay && !prefersReducedMotion

  switch (resolved) {
    case 'youtube':
      return (
        <YouTubeEmbed
          videoId={extractEmbedId(src, 'youtube')}
          title={a11yTitle}
          autoplay={safeAutoplay}
          muted={muted}
          loop={loop}
          aspectRatio={aspectRatio}
          className={className}
          onError={onIframeError}
        />
      )
    case 'vimeo':
      return (
        <VimeoEmbed
          videoId={extractEmbedId(src, 'vimeo')}
          title={a11yTitle}
          autoplay={safeAutoplay}
          muted={muted}
          loop={loop}
          aspectRatio={aspectRatio}
          className={className}
          onError={onIframeError}
        />
      )
    case 'loom':
      return (
        <LoomEmbed
          videoId={extractEmbedId(src, 'loom')}
          title={a11yTitle}
          autoplay={safeAutoplay}
          muted={muted}
          loop={loop}
          aspectRatio={aspectRatio}
          className={className}
          onError={onIframeError}
        />
      )
    case 'wistia':
      return (
        <WistiaEmbed
          videoId={extractEmbedId(src, 'wistia')}
          title={a11yTitle}
          autoplay={safeAutoplay}
          muted={muted}
          loop={loop}
          aspectRatio={aspectRatio}
          className={className}
          onError={onIframeError}
        />
      )
    case 'video':
      return (
        <NativeVideo
          src={src}
          alt={alt ?? ''}
          poster={poster}
          autoplay={safeAutoplay}
          muted={muted}
          loop={loop}
          aspectRatio={aspectRatio}
          className={className}
        />
      )
    case 'gif':
      if (prefersReducedMotion && !poster && process.env.NODE_ENV !== 'production') {
        console.warn('[MediaSlot] GIF rendered without poster under prefers-reduced-motion: reduce')
      }
      return (
        <GifPlayer
          src={src}
          alt={alt ?? ''}
          poster={poster}
          autoplay={safeAutoplay}
          aspectRatio={aspectRatio}
          className={className}
        />
      )
    case 'lottie':
      return (
        <LottiePlayer
          src={src}
          alt={alt ?? ''}
          autoplay={safeAutoplay}
          loop={loop}
          aspectRatio={aspectRatio}
          className={className}
        />
      )
    case 'image':
      return <img src={src} alt={alt ?? ''} className={className} loading="lazy" />
  }
}

/**
 * Universal media dispatcher. Auto-detects the embed provider via URL pattern
 * matching (or honors an explicit `type` override) and delegates to the
 * matching `@tour-kit/media` embed component.
 *
 * @example
 * ```tsx
 * <MediaSlot src="https://youtu.be/dQw4w9WgXcQ" />
 * <MediaSlot src="/video.mp4" autoplay loop />
 * <MediaSlot src="https://my-cdn/x" type="video" />
 * ```
 */
export const MediaSlot: React.FC<MediaSlotProps> = ({
  src,
  type = 'auto',
  poster,
  aspectRatio,
  className,
  alt,
  title,
  autoplay = false,
  loop = false,
  muted = true,
}) => {
  const prefersReducedMotion = useReducedMotion()
  const [errored, setErrored] = React.useState(false)

  const resolved: ResolvedMediaSlotType = type === 'auto' ? detectMediaSlotType(src) : type

  if (errored && IFRAME_PROVIDERS.has(resolved)) {
    return <MediaErrorFallback url={src} provider={resolved} className={className} />
  }

  return renderDispatch({
    resolved,
    src,
    alt,
    title,
    poster,
    aspectRatio,
    className,
    autoplay,
    loop,
    muted,
    onIframeError: () => setErrored(true),
    prefersReducedMotion,
  })
}

MediaSlot.displayName = 'MediaSlot'
