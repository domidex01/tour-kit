'use client'

import * as React from 'react'
import type { MediaHeadlessProps, MediaHeadlessRenderProps, MediaType } from '../../types'
import { detectMediaType, parseMediaUrl } from '../../utils/parse-media-url'

/**
 * Headless media component that provides render props for full control
 * over the media rendering and behavior.
 *
 * @example
 * ```tsx
 * <MediaHeadless src="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
 *   {({ mediaType, embedUrl, isLoaded, isPlaying, play, pause }) => (
 *     <div>
 *       {mediaType === 'youtube' && (
 *         <iframe src={embedUrl} />
 *       )}
 *       <button onClick={isPlaying ? pause : play}>
 *         {isPlaying ? 'Pause' : 'Play'}
 *       </button>
 *     </div>
 *   )}
 * </MediaHeadless>
 * ```
 */
export function MediaHeadless({ src, type, children }: MediaHeadlessProps): React.ReactNode {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // State
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)

  // Check for reduced motion preference
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Parse media URL
  const mediaType: MediaType = type ?? detectMediaType(src)
  const parsed = parseMediaUrl(src)

  // Actions
  const play = React.useCallback(() => {
    setIsPlaying(true)
  }, [])

  const pause = React.useCallback(() => {
    setIsPlaying(false)
  }, [])

  const seek = React.useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, Math.min(time, duration)))
    },
    [duration]
  )

  // Mark as loaded (can be called by consumer)
  const markLoaded = React.useCallback(() => {
    setIsLoaded(true)
    setHasError(false)
    setErrorMessage(null)
  }, [])

  // Mark as error (can be called by consumer)
  const markError = React.useCallback((message: string) => {
    setHasError(true)
    setErrorMessage(message)
    setIsLoaded(false)
  }, [])

  // Update duration (can be called by consumer)
  const updateDuration = React.useCallback((newDuration: number) => {
    setDuration(newDuration)
  }, [])

  // Update current time (can be called by consumer)
  const updateCurrentTime = React.useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  // Render props
  const renderProps: MediaHeadlessRenderProps = {
    mediaType,
    src,
    embedUrl: parsed?.embedUrl ?? null,
    videoId: parsed?.id ?? null,
    isPlaying,
    isLoaded,
    hasError,
    errorMessage,
    currentTime,
    duration,
    play,
    pause,
    seek,
    markLoaded,
    markError,
    updateDuration,
    updateCurrentTime,
    prefersReducedMotion,
    containerRef,
  }

  return children(renderProps)
}

MediaHeadless.displayName = 'MediaHeadless'
