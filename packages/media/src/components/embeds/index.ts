import { withLicenseCheck } from '../../lib/with-license-check'

// ============================================
// PLATFORM EMBEDS
// ============================================

import { type LoomEmbedProps, LoomEmbed as _LoomEmbed } from './loom-embed'
import { type VimeoEmbedProps, VimeoEmbed as _VimeoEmbed } from './vimeo-embed'
import { type WistiaEmbedProps, WistiaEmbed as _WistiaEmbed } from './wistia-embed'
import { type YouTubeEmbedProps, YouTubeEmbed as _YouTubeEmbed } from './youtube-embed'

export type { YouTubeEmbedProps, VimeoEmbedProps, LoomEmbedProps, WistiaEmbedProps }

export const YouTubeEmbed = withLicenseCheck(_YouTubeEmbed, 'YouTubeEmbed')
export const VimeoEmbed = withLicenseCheck(_VimeoEmbed, 'VimeoEmbed')
export const LoomEmbed = withLicenseCheck(_LoomEmbed, 'LoomEmbed')
export const WistiaEmbed = withLicenseCheck(_WistiaEmbed, 'WistiaEmbed')

// ============================================
// NATIVE MEDIA
// ============================================

import { type GifPlayerProps, GifPlayer as _GifPlayer } from './gif-player'
import { type LottiePlayerProps, LottiePlayer as _LottiePlayer } from './lottie-player'
import { type NativeVideoProps, NativeVideo as _NativeVideo } from './native-video'

export type { NativeVideoProps, GifPlayerProps, LottiePlayerProps }

export const NativeVideo = withLicenseCheck(_NativeVideo, 'NativeVideo')
export const GifPlayer = withLicenseCheck(_GifPlayer, 'GifPlayer')
export const LottiePlayer = withLicenseCheck(_LottiePlayer, 'LottiePlayer')
