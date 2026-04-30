// ============================================
// MAIN COMPONENT
// ============================================

export { TourMedia, type TourMediaComponentProps } from './components/tour-media'

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
} from './lib/ui-library-context'

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
