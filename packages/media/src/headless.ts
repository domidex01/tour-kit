// ============================================
// HEADLESS COMPONENTS
// ============================================

export { MediaHeadless } from './components/headless'

// ============================================
// UTILITIES
// ============================================

export { cn } from '@tour-kit/core'
export { Slot, Slottable } from './lib/slot'

export {
  parseMediaUrl,
  detectMediaType,
  isSupportedMediaUrl,
  isEmbedType,
  isNativeVideoType,
  supportsAutoplay,
  extractYouTubeId,
  extractVimeoId,
  extractLoomId,
  extractWistiaId,
  buildYouTubeEmbedUrl,
  buildVimeoEmbedUrl,
  buildLoomEmbedUrl,
  buildWistiaEmbedUrl,
  getYouTubeThumbnailUrl,
  selectResponsiveSource,
  getSourceType,
  type EmbedUrlOptions,
} from './utils'

// ============================================
// HOOKS
// ============================================

export {
  useMediaEvents,
  usePrefersReducedMotion,
  useResponsiveSource,
  type UseMediaEventsOptions,
  type UseMediaEventsReturn,
} from './hooks'

// ============================================
// TYPES
// ============================================

export type {
  AspectRatio,
  MediaType,
  CaptionTrack,
  ResponsiveSource,
  ParsedMediaUrl,
  LottieOptions,
  TourMediaConfig,
  TourMediaProps,
  MediaHeadlessRenderProps,
  MediaHeadlessProps,
  MediaEventName,
  MediaEvent,
  MediaEventHandlers,
} from './types'
