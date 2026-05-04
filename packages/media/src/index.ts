// ============================================
// MAIN COMPONENT
// ============================================

export { TourMedia, type TourMediaComponentProps } from './components/tour-media'

// ============================================
// MEDIA SLOT (universal dispatcher)
// ============================================

export { MediaSlot, type MediaSlotProps } from './components/media-slot'
export {
  detectMediaSlotType,
  PATTERNS as MEDIA_SLOT_PATTERNS,
  type MediaSlotType,
  type ResolvedMediaSlotType,
} from './lib/detect-media-type'

// ============================================
// EMBED COMPONENTS
// ============================================

export {
  YouTubeEmbed,
  VimeoEmbed,
  LoomEmbed,
  WistiaEmbed,
  NativeVideo,
  GifPlayer,
  LottiePlayer,
  type YouTubeEmbedProps,
  type VimeoEmbedProps,
  type LoomEmbedProps,
  type WistiaEmbedProps,
  type NativeVideoProps,
  type GifPlayerProps,
  type LottiePlayerProps,
} from './components/embeds'

// ============================================
// HEADLESS
// ============================================

export { MediaHeadless } from './components/headless'

// ============================================
// UI VARIANTS
// ============================================

export {
  mediaContainerVariants,
  mediaOverlayVariants,
  playButtonVariants,
  iframeVariants,
  type MediaContainerVariants,
  type MediaOverlayVariants,
  type PlayButtonVariants,
  type IframeVariants,
} from './components/ui'

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
// UTILITIES
// ============================================

export { cn } from '@tour-kit/core'
export { Slot, Slottable, UnifiedSlot, type RenderProp, type UnifiedSlotProps } from './lib/slot'
export {
  UILibraryProvider,
  useUILibrary,
  type UILibrary,
  type UILibraryProviderProps,
} from '@tour-kit/core'

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
  isYouTubeUrl,
  isVimeoUrl,
  isLoomUrl,
  isWistiaUrl,
  buildYouTubeEmbedUrl,
  buildVimeoEmbedUrl,
  buildLoomEmbedUrl,
  buildWistiaEmbedUrl,
  getYouTubeThumbnailUrl,
  getVimeoThumbnailUrl,
  selectResponsiveSource,
  getSourceType,
  type EmbedUrlOptions,
} from './utils'

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
