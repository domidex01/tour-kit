// ============================================
// URL PARSING
// ============================================

export {
  parseMediaUrl,
  detectMediaType,
  isSupportedMediaUrl,
  isEmbedType,
  isNativeVideoType,
  supportsAutoplay,
} from './parse-media-url'

// ============================================
// VIDEO ID EXTRACTION
// ============================================

export {
  extractYouTubeId,
  extractVimeoId,
  extractLoomId,
  extractWistiaId,
  isYouTubeUrl,
  isVimeoUrl,
  isLoomUrl,
  isWistiaUrl,
} from './extract-video-id'

// ============================================
// EMBED URL BUILDERS
// ============================================

export {
  buildYouTubeEmbedUrl,
  buildVimeoEmbedUrl,
  buildLoomEmbedUrl,
  buildWistiaEmbedUrl,
  getYouTubeThumbnailUrl,
  getVimeoThumbnailUrl,
  type EmbedUrlOptions,
} from './embed-urls'

// ============================================
// RESPONSIVE SOURCES
// ============================================

export {
  selectResponsiveSource,
  useResponsiveSource,
  getSourceType,
} from './responsive'
