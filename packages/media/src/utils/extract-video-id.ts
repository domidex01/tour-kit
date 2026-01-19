/**
 * Regular expressions for extracting video IDs from various platforms
 */

// YouTube patterns:
// - youtube.com/watch?v=VIDEO_ID
// - youtube.com/embed/VIDEO_ID
// - youtube.com/v/VIDEO_ID
// - youtu.be/VIDEO_ID
// - youtube-nocookie.com/embed/VIDEO_ID
const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/

// Vimeo patterns:
// - vimeo.com/VIDEO_ID
// - player.vimeo.com/video/VIDEO_ID
const VIMEO_REGEX = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/

// Loom patterns:
// - loom.com/share/VIDEO_ID
// - loom.com/embed/VIDEO_ID
const LOOM_REGEX = /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/

// Wistia patterns:
// - wistia.com/medias/VIDEO_ID
// - fast.wistia.net/embed/iframe/VIDEO_ID
// - fast.wistia.com/embed/medias/VIDEO_ID
const WISTIA_REGEX =
  /(?:wistia\.com\/medias\/|fast\.wistia\.(?:net|com)\/embed\/(?:iframe|medias)\/)([a-zA-Z0-9]+)/

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX)
  return match?.[1] ?? null
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(VIMEO_REGEX)
  return match?.[1] ?? null
}

/**
 * Extract Loom video ID from URL
 */
export function extractLoomId(url: string): string | null {
  const match = url.match(LOOM_REGEX)
  return match?.[1] ?? null
}

/**
 * Extract Wistia video ID from URL
 */
export function extractWistiaId(url: string): string | null {
  const match = url.match(WISTIA_REGEX)
  return match?.[1] ?? null
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url)
}

/**
 * Check if URL is a Vimeo URL
 */
export function isVimeoUrl(url: string): boolean {
  return VIMEO_REGEX.test(url)
}

/**
 * Check if URL is a Loom URL
 */
export function isLoomUrl(url: string): boolean {
  return LOOM_REGEX.test(url)
}

/**
 * Check if URL is a Wistia URL
 */
export function isWistiaUrl(url: string): boolean {
  return WISTIA_REGEX.test(url)
}
