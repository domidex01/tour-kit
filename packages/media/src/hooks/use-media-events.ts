'use client'

import * as React from 'react'
import type { MediaEvent, MediaEventHandlers, MediaType } from '../types'

export interface UseMediaEventsOptions extends MediaEventHandlers {
  /** Media type */
  mediaType: MediaType
  /** Media source URL */
  mediaSrc: string
  /** Associated tour ID */
  tourId?: string
  /** Associated step ID */
  stepId?: string
  /** Custom event handler for analytics integration */
  onEvent?: (event: MediaEvent) => void
}

export interface UseMediaEventsReturn {
  /** Handle media loaded event */
  handleLoaded: (loadTime?: number) => void
  /** Handle media play event */
  handlePlay: () => void
  /** Handle media pause event */
  handlePause: (currentTime?: number) => void
  /** Handle media complete event */
  handleComplete: (watchTime?: number) => void
  /** Handle media error event */
  handleError: (error: string) => void
  /** Handle time update event */
  handleTimeUpdate: (currentTime: number, duration: number) => void
}

/**
 * Hook for handling media events and analytics
 */
export function useMediaEvents({
  mediaType,
  mediaSrc,
  tourId,
  stepId,
  onLoaded,
  onPlay,
  onPause,
  onComplete,
  onError,
  onTimeUpdate,
  onEvent,
}: UseMediaEventsOptions): UseMediaEventsReturn {
  const startTimeRef = React.useRef<number | null>(null)

  const createEvent = React.useCallback(
    (eventName: MediaEvent['eventName'], extra?: Partial<MediaEvent>): MediaEvent => ({
      eventName,
      timestamp: Date.now(),
      mediaType,
      mediaSrc,
      tourId,
      stepId,
      ...extra,
    }),
    [mediaType, mediaSrc, tourId, stepId]
  )

  const handleLoaded = React.useCallback(
    (loadTime?: number) => {
      onLoaded?.()
      onEvent?.(createEvent('media_loaded', { loadTime }))
    },
    [onLoaded, onEvent, createEvent]
  )

  const handlePlay = React.useCallback(() => {
    startTimeRef.current = Date.now()
    onPlay?.()
    onEvent?.(createEvent('media_play'))
  }, [onPlay, onEvent, createEvent])

  const handlePause = React.useCallback(
    (currentTime?: number) => {
      onPause?.()
      onEvent?.(createEvent('media_pause', { currentTime }))
    },
    [onPause, onEvent, createEvent]
  )

  const handleComplete = React.useCallback(
    (watchTime?: number) => {
      const calculatedWatchTime =
        watchTime ?? (startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : undefined)
      onComplete?.()
      onEvent?.(createEvent('media_complete', { watchTime: calculatedWatchTime }))
    },
    [onComplete, onEvent, createEvent]
  )

  const handleError = React.useCallback(
    (error: string) => {
      onError?.(error)
      onEvent?.(createEvent('media_error', { error }))
    },
    [onError, onEvent, createEvent]
  )

  const handleTimeUpdate = React.useCallback(
    (currentTime: number, duration: number) => {
      onTimeUpdate?.(currentTime, duration)
      // Don't emit events for every time update - too noisy
    },
    [onTimeUpdate]
  )

  return {
    handleLoaded,
    handlePlay,
    handlePause,
    handleComplete,
    handleError,
    handleTimeUpdate,
  }
}
