import { withLicenseCheck } from '../../lib/with-license-check'

// ============================================
// PLATFORM EMBEDS
// ============================================

import { YouTubeEmbed as _YouTubeEmbed, type YouTubeEmbedProps } from './youtube-embed'
import { VimeoEmbed as _VimeoEmbed, type VimeoEmbedProps } from './vimeo-embed'
import { LoomEmbed as _LoomEmbed, type LoomEmbedProps } from './loom-embed'
import { WistiaEmbed as _WistiaEmbed, type WistiaEmbedProps } from './wistia-embed'

export type { YouTubeEmbedProps, VimeoEmbedProps, LoomEmbedProps, WistiaEmbedProps }

export const YouTubeEmbed = withLicenseCheck(_YouTubeEmbed, 'YouTubeEmbed')
export const VimeoEmbed = withLicenseCheck(_VimeoEmbed, 'VimeoEmbed')
export const LoomEmbed = withLicenseCheck(_LoomEmbed, 'LoomEmbed')
export const WistiaEmbed = withLicenseCheck(_WistiaEmbed, 'WistiaEmbed')

// ============================================
// NATIVE MEDIA
// ============================================

import { NativeVideo as _NativeVideo, type NativeVideoProps } from './native-video'
import { GifPlayer as _GifPlayer, type GifPlayerProps } from './gif-player'
import { LottiePlayer as _LottiePlayer, type LottiePlayerProps } from './lottie-player'

export type { NativeVideoProps, GifPlayerProps, LottiePlayerProps }

export const NativeVideo = withLicenseCheck(_NativeVideo, 'NativeVideo')
export const GifPlayer = withLicenseCheck(_GifPlayer, 'GifPlayer')
export const LottiePlayer = withLicenseCheck(_LottiePlayer, 'LottiePlayer')
