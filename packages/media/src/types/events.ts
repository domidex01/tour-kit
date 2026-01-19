import type { MediaType } from './media'

/**
 * Media analytics event names
 */
export type MediaEventName =
  | 'media_loaded'
  | 'media_play'
  | 'media_pause'
  | 'media_complete'
  | 'media_error'
  | 'media_time_update'

/**
 * Media analytics event payload
 */
export interface MediaEvent {
  /** Event name */
  eventName: MediaEventName
  /** Event timestamp */
  timestamp: number
  /** Type of media */
  mediaType: MediaType
  /** Source URL */
  mediaSrc: string
  /** Associated tour ID (if within a tour) */
  tourId?: string
  /** Associated step ID (if within a tour step) */
  stepId?: string
  /** Current playback time in seconds */
  currentTime?: number
  /** Total duration in seconds */
  duration?: number
  /** Error message (for error events) */
  error?: string
  /** Load time in milliseconds (for loaded events) */
  loadTime?: number
  /** Watch time in seconds (for complete events) */
  watchTime?: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Callback handlers for media events
 */
export interface MediaEventHandlers {
  /** Called when media is loaded */
  onLoaded?: () => void
  /** Called when media starts playing */
  onPlay?: () => void
  /** Called when media is paused */
  onPause?: () => void
  /** Called when media playback completes */
  onComplete?: () => void
  /** Called when media fails to load */
  onError?: (error: string) => void
  /** Called on playback progress */
  onTimeUpdate?: (currentTime: number, duration: number) => void
}
