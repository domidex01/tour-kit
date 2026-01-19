import * as React from 'react'
import type { ResponsiveSource } from '../types'

/**
 * Select the appropriate responsive source based on current viewport
 * Uses window.matchMedia for client-side detection
 */
export function selectResponsiveSource(
  sources: ResponsiveSource[] | undefined,
  defaultSrc: string
): string {
  if (!sources || sources.length === 0) {
    return defaultSrc
  }

  // Server-side: return default
  if (typeof window === 'undefined') {
    return defaultSrc
  }

  // Find first matching source
  for (const source of sources) {
    if (source.media) {
      if (window.matchMedia(source.media).matches) {
        return source.src
      }
    }
  }

  // Return default if no match
  return defaultSrc
}

/**
 * Hook for responsive source selection with resize listener
 */
export function useResponsiveSource(
  sources: ResponsiveSource[] | undefined,
  defaultSrc: string
): string {
  const [selectedSrc, setSelectedSrc] = React.useState(() =>
    selectResponsiveSource(sources, defaultSrc)
  )

  React.useEffect(() => {
    if (!sources || sources.length === 0) {
      setSelectedSrc(defaultSrc)
      return
    }

    // Update source on mount
    setSelectedSrc(selectResponsiveSource(sources, defaultSrc))

    // Listen for resize events
    const handleResize = () => {
      setSelectedSrc(selectResponsiveSource(sources, defaultSrc))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sources, defaultSrc])

  return selectedSrc
}

/**
 * Get source type for video source elements
 */
export function getSourceType(src: string): string | undefined {
  const extension = src.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogg':
      return 'video/ogg'
    case 'mov':
      return 'video/quicktime'
    case 'm4v':
      return 'video/x-m4v'
    default:
      return undefined
  }
}
