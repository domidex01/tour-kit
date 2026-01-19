import type * as React from 'react'

/**
 * Aspect ratio options for media containers
 */
export type AspectRatio = '16/9' | '4/3' | '1/1' | '9/16' | '21/9' | 'auto'

/**
 * Supported media types that can be auto-detected or explicitly specified
 */
export type MediaType =
  | 'youtube'
  | 'vimeo'
  | 'loom'
  | 'wistia'
  | 'video'
  | 'gif'
  | 'lottie'
  | 'image'

/**
 * Caption/subtitle track for video content
 */
export interface CaptionTrack {
  /** URL to the caption file (VTT, SRT) */
  src: string
  /** Language code (e.g., 'en', 'es', 'fr') */
  srclang: string
  /** Human-readable label (e.g., 'English', 'Spanish') */
  label: string
  /** Whether this track is selected by default */
  default?: boolean
}

/**
 * Responsive source for different viewport sizes
 */
export interface ResponsiveSource {
  /** Media source URL */
  src: string
  /** Media query for when to use this source (e.g., "(min-width: 768px)") */
  media?: string
  /** MIME type (e.g., "video/mp4") */
  type?: string
}

/**
 * Parsed result from URL detection
 */
export interface ParsedMediaUrl {
  /** Detected media type */
  type: MediaType
  /** Video/media ID for platform-specific embeds */
  id: string
  /** Full embed URL ready to use in iframe */
  embedUrl: string
  /** Thumbnail URL if available */
  thumbnailUrl?: string
}

/**
 * Lottie-specific animation options
 */
export interface LottieOptions {
  /** Animation playback speed (default: 1) */
  speed?: number
  /** Animation direction (1 = forward, -1 = reverse) */
  direction?: 1 | -1
  /** Renderer type */
  renderer?: 'svg' | 'canvas'
}

/**
 * Main media configuration interface
 */
export interface TourMediaConfig {
  /** Media source URL or embed ID */
  src: string
  /** Explicit type override (auto-detected if omitted) */
  type?: MediaType
  /** Alternative text for accessibility (required) */
  alt: string
  /** Poster/thumbnail image URL for videos */
  poster?: string
  /** Aspect ratio */
  aspectRatio?: AspectRatio
  /** Auto-play the media (requires muted=true for videos in most browsers) */
  autoplay?: boolean
  /** Mute audio (default: true for autoplay compliance) */
  muted?: boolean
  /** Show player controls */
  controls?: boolean
  /** Loop the media */
  loop?: boolean
  /** Plays inline on mobile (prevents fullscreen) */
  playsInline?: boolean
  /** Start time in seconds for videos */
  startTime?: number
  /** Caption tracks for videos */
  captions?: CaptionTrack[]
  /** Responsive sources for different breakpoints */
  sources?: ResponsiveSource[]
  /** Lottie-specific options */
  lottieOptions?: LottieOptions
  /** Static image fallback for prefers-reduced-motion */
  reducedMotionFallback?: string
  /** Loading strategy */
  loading?: 'eager' | 'lazy'
  /** Preload strategy for videos */
  preload?: 'none' | 'metadata' | 'auto'
}

/**
 * Props for the main TourMedia component
 */
export interface TourMediaProps extends TourMediaConfig {
  /** Additional CSS class name */
  className?: string
  /** Callback when media is loaded */
  onLoaded?: () => void
  /** Callback when media starts playing */
  onPlay?: () => void
  /** Callback when media is paused */
  onPause?: () => void
  /** Callback when media playback completes */
  onComplete?: () => void
  /** Callback when media fails to load */
  onError?: (error: string) => void
  /** Callback for playback progress */
  onProgress?: (currentTime: number, duration: number) => void
}

/**
 * Render props for headless media component
 */
export interface MediaHeadlessRenderProps {
  /** Detected or specified media type */
  mediaType: MediaType
  /** Original source URL */
  src: string
  /** Computed embed URL (for iframe embeds) */
  embedUrl: string | null
  /** Extracted video ID (for platform embeds) */
  videoId: string | null
  /** Whether media is currently playing */
  isPlaying: boolean
  /** Whether media has loaded */
  isLoaded: boolean
  /** Whether there was an error */
  hasError: boolean
  /** Error message if any */
  errorMessage: string | null
  /** Current playback time in seconds */
  currentTime: number
  /** Total duration in seconds */
  duration: number
  /** Start playback */
  play: () => void
  /** Pause playback */
  pause: () => void
  /** Seek to specific time */
  seek: (time: number) => void
  /** Mark media as loaded */
  markLoaded: () => void
  /** Mark media as errored */
  markError: (message: string) => void
  /** Update media duration */
  updateDuration: (duration: number) => void
  /** Update current playback time */
  updateCurrentTime: (time: number) => void
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean
  /** Container ref for positioning */
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Props for headless media component
 */
export interface MediaHeadlessProps {
  /** Media source URL */
  src: string
  /** Explicit type override */
  type?: MediaType
  /** Render function receiving media state and controls */
  children: (props: MediaHeadlessRenderProps) => React.ReactNode
}
