import type { MediaType, ParsedMediaUrl } from '../types'
import {
  buildLoomEmbedUrl,
  buildVimeoEmbedUrl,
  buildWistiaEmbedUrl,
  buildYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from './embed-urls'
import {
  extractLoomId,
  extractVimeoId,
  extractWistiaId,
  extractYouTubeId,
  isLoomUrl,
  isVimeoUrl,
  isWistiaUrl,
  isYouTubeUrl,
} from './extract-video-id'

/**
 * File extension patterns for direct media files
 */
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i
const GIF_EXTENSION = /\.gif(\?.*)?$/i
const LOTTIE_EXTENSIONS = /\.(json|lottie)(\?.*)?$/i
const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|webp|avif|svg)(\?.*)?$/i

/**
 * Detect media type from URL
 */
export function detectMediaType(url: string): MediaType {
  // Check platform URLs first
  if (isYouTubeUrl(url)) return 'youtube'
  if (isVimeoUrl(url)) return 'vimeo'
  if (isLoomUrl(url)) return 'loom'
  if (isWistiaUrl(url)) return 'wistia'

  // Check file extensions
  if (VIDEO_EXTENSIONS.test(url)) return 'video'
  if (GIF_EXTENSION.test(url)) return 'gif'
  if (LOTTIE_EXTENSIONS.test(url)) return 'lottie'
  if (IMAGE_EXTENSIONS.test(url)) return 'image'

  // Default to image for unknown URLs
  return 'image'
}

/**
 * Parse a media URL and return structured information
 * Auto-detects the media type and extracts relevant IDs and embed URLs
 */
export function parseMediaUrl(url: string): ParsedMediaUrl | null {
  if (!url) return null

  const type = detectMediaType(url)

  switch (type) {
    case 'youtube': {
      const videoId = extractYouTubeId(url)
      if (!videoId) return null
      return {
        type: 'youtube',
        id: videoId,
        embedUrl: buildYouTubeEmbedUrl(videoId),
        thumbnailUrl: getYouTubeThumbnailUrl(videoId),
      }
    }

    case 'vimeo': {
      const videoId = extractVimeoId(url)
      if (!videoId) return null
      return {
        type: 'vimeo',
        id: videoId,
        embedUrl: buildVimeoEmbedUrl(videoId),
        // Vimeo thumbnails require API call
      }
    }

    case 'loom': {
      const videoId = extractLoomId(url)
      if (!videoId) return null
      return {
        type: 'loom',
        id: videoId,
        embedUrl: buildLoomEmbedUrl(videoId),
      }
    }

    case 'wistia': {
      const videoId = extractWistiaId(url)
      if (!videoId) return null
      return {
        type: 'wistia',
        id: videoId,
        embedUrl: buildWistiaEmbedUrl(videoId),
      }
    }

    case 'video':
      return {
        type: 'video',
        id: url,
        embedUrl: url,
      }

    case 'gif':
      return {
        type: 'gif',
        id: url,
        embedUrl: url,
      }

    case 'lottie':
      return {
        type: 'lottie',
        id: url,
        embedUrl: url,
      }
    default:
      return {
        type: 'image',
        id: url,
        embedUrl: url,
      }
  }
}

/**
 * Check if a URL is a supported media URL
 */
export function isSupportedMediaUrl(url: string): boolean {
  const type = detectMediaType(url)
  return type !== 'image' || IMAGE_EXTENSIONS.test(url)
}

/**
 * Check if media type is an embedded iframe (YouTube, Vimeo, Loom, Wistia)
 */
export function isEmbedType(type: MediaType): boolean {
  return ['youtube', 'vimeo', 'loom', 'wistia'].includes(type)
}

/**
 * Check if media type is a native video element
 */
export function isNativeVideoType(type: MediaType): boolean {
  return type === 'video'
}

/**
 * Check if media type supports autoplay
 */
export function supportsAutoplay(type: MediaType): boolean {
  return ['youtube', 'vimeo', 'loom', 'wistia', 'video', 'gif', 'lottie'].includes(type)
}
