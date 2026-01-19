/**
 * Options for building embed URLs
 */
export interface EmbedUrlOptions {
  /** Auto-play the video */
  autoplay?: boolean
  /** Mute the video */
  muted?: boolean
  /** Show player controls */
  controls?: boolean
  /** Loop the video */
  loop?: boolean
  /** Start time in seconds */
  startTime?: number
}

/**
 * Build YouTube embed URL with privacy mode (youtube-nocookie.com)
 * Uses youtube-nocookie.com for GDPR compliance
 */
export function buildYouTubeEmbedUrl(videoId: string, options: EmbedUrlOptions = {}): string {
  const params = new URLSearchParams()

  if (options.autoplay) {
    params.set('autoplay', '1')
  }
  if (options.muted) {
    params.set('mute', '1')
  }
  if (options.controls === false) {
    params.set('controls', '0')
  }
  if (options.loop) {
    params.set('loop', '1')
    // YouTube loop requires playlist parameter
    params.set('playlist', videoId)
  }
  if (options.startTime !== undefined && options.startTime > 0) {
    params.set('start', String(Math.floor(options.startTime)))
  }

  // Privacy and UI settings
  params.set('rel', '0') // Don't show related videos from other channels
  params.set('modestbranding', '1') // Minimal YouTube branding

  const queryString = params.toString()
  return `https://www.youtube-nocookie.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`
}

/**
 * Build Vimeo embed URL
 */
export function buildVimeoEmbedUrl(videoId: string, options: EmbedUrlOptions = {}): string {
  const params = new URLSearchParams()

  if (options.autoplay) {
    params.set('autoplay', '1')
  }
  if (options.muted) {
    params.set('muted', '1')
  }
  if (options.loop) {
    params.set('loop', '1')
  }
  // Vimeo uses #t= for start time instead of query param
  const timeFragment =
    options.startTime !== undefined && options.startTime > 0
      ? `#t=${Math.floor(options.startTime)}s`
      : ''

  // Vimeo-specific settings
  params.set('dnt', '1') // Do Not Track for privacy

  const queryString = params.toString()
  return `https://player.vimeo.com/video/${videoId}${queryString ? `?${queryString}` : ''}${timeFragment}`
}

/**
 * Build Loom embed URL
 */
export function buildLoomEmbedUrl(videoId: string, options: EmbedUrlOptions = {}): string {
  const params = new URLSearchParams()

  // Loom uses different parameter names
  if (options.autoplay) {
    params.set('autoplay', 'true')
  }
  if (options.muted) {
    params.set('muted', 'true')
  }
  if (options.loop) {
    params.set('loop', 'true')
  }
  if (options.controls === false) {
    params.set('hide_controls', 'true')
  }
  if (options.startTime !== undefined && options.startTime > 0) {
    params.set('t', String(Math.floor(options.startTime)))
  }

  const queryString = params.toString()
  return `https://www.loom.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`
}

/**
 * Build Wistia embed URL
 */
export function buildWistiaEmbedUrl(videoId: string, options: EmbedUrlOptions = {}): string {
  const params = new URLSearchParams()

  if (options.autoplay) {
    params.set('autoPlay', 'true')
  }
  if (options.muted) {
    params.set('muted', 'true')
    params.set('silentAutoPlay', 'true')
  }
  if (options.controls === false) {
    params.set('controlsVisibleOnLoad', 'false')
  }
  if (options.loop) {
    params.set('endVideoBehavior', 'loop')
  }
  if (options.startTime !== undefined && options.startTime > 0) {
    params.set('time', String(options.startTime))
  }

  const queryString = params.toString()
  return `https://fast.wistia.net/embed/iframe/${videoId}${queryString ? `?${queryString}` : ''}`
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'
): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/**
 * Get Vimeo thumbnail URL (requires API call, returns a placeholder function)
 * Note: Vimeo thumbnails require an API call to fetch
 */
export function getVimeoThumbnailUrl(videoId: string): string {
  // This returns the oEmbed endpoint - actual thumbnail needs API fetch
  return `https://vimeo.com/api/v2/video/${videoId}.json`
}
