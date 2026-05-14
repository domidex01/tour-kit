import { LicenseGate } from '@tour-kit/license'
import * as React from 'react'

// ============================================
// PLATFORM EMBEDS
// ============================================

import { type LoomEmbedProps, LoomEmbed as _LoomEmbed } from './loom-embed'
import { type VimeoEmbedProps, VimeoEmbed as _VimeoEmbed } from './vimeo-embed'
import { type WistiaEmbedProps, WistiaEmbed as _WistiaEmbed } from './wistia-embed'
import { type YouTubeEmbedProps, YouTubeEmbed as _YouTubeEmbed } from './youtube-embed'

export type { YouTubeEmbedProps, VimeoEmbedProps, LoomEmbedProps, WistiaEmbedProps }

function withLicenseGate<P extends object>(
  Component: React.ComponentType<P>,
  displayName: string
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) =>
    React.createElement(LicenseGate, {
      require: 'pro',
      // biome-ignore lint/correctness/noChildrenProp: LicenseGateProps requires children in the props object
      children: React.createElement<P>(Component, props),
    })
  Wrapped.displayName = `Licensed(${displayName})`
  return Wrapped
}

export const YouTubeEmbed = withLicenseGate(_YouTubeEmbed, 'YouTubeEmbed')
export const VimeoEmbed = withLicenseGate(_VimeoEmbed, 'VimeoEmbed')
export const LoomEmbed = withLicenseGate(_LoomEmbed, 'LoomEmbed')
export const WistiaEmbed = withLicenseGate(_WistiaEmbed, 'WistiaEmbed')

// ============================================
// NATIVE MEDIA
// ============================================

import { type GifPlayerProps, GifPlayer as _GifPlayer } from './gif-player'
import { type LottiePlayerProps, LottiePlayer as _LottiePlayer } from './lottie-player'
import { type NativeVideoProps, NativeVideo as _NativeVideo } from './native-video'

export type { NativeVideoProps, GifPlayerProps, LottiePlayerProps }

export const NativeVideo = withLicenseGate(_NativeVideo, 'NativeVideo')
export const GifPlayer = withLicenseGate(_GifPlayer, 'GifPlayer')
export const LottiePlayer = withLicenseGate(_LottiePlayer, 'LottiePlayer')
