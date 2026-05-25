// ============================================
// PLATFORM EMBEDS
// ============================================

import { type LoomEmbedProps, LoomEmbed as _LoomEmbed } from './loom-embed'
import { type VimeoEmbedProps, VimeoEmbed as _VimeoEmbed } from './vimeo-embed'
import { type WistiaEmbedProps, WistiaEmbed as _WistiaEmbed } from './wistia-embed'
import { type YouTubeEmbedProps, YouTubeEmbed as _YouTubeEmbed } from './youtube-embed'

export type { YouTubeEmbedProps, VimeoEmbedProps, LoomEmbedProps, WistiaEmbedProps }

export const YouTubeEmbed = _YouTubeEmbed
export const VimeoEmbed = _VimeoEmbed
export const LoomEmbed = _LoomEmbed
export const WistiaEmbed = _WistiaEmbed

// ============================================
// NATIVE MEDIA
// ============================================

import { type GifPlayerProps, GifPlayer as _GifPlayer } from './gif-player'
import { type LottiePlayerProps, LottiePlayer as _LottiePlayer } from './lottie-player'
import { type NativeVideoProps, NativeVideo as _NativeVideo } from './native-video'

export type { NativeVideoProps, GifPlayerProps, LottiePlayerProps }

export const NativeVideo = _NativeVideo
export const GifPlayer = _GifPlayer
export const LottiePlayer = _LottiePlayer
