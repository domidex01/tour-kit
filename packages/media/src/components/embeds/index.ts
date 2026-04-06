import { ProGate } from '@tour-kit/license'
import * as React from 'react'

// ============================================
// PLATFORM EMBEDS
// ============================================

import { type LoomEmbedProps, LoomEmbed as _LoomEmbed } from './loom-embed'
import { type VimeoEmbedProps, VimeoEmbed as _VimeoEmbed } from './vimeo-embed'
import { type WistiaEmbedProps, WistiaEmbed as _WistiaEmbed } from './wistia-embed'
import { type YouTubeEmbedProps, YouTubeEmbed as _YouTubeEmbed } from './youtube-embed'

export type { YouTubeEmbedProps, VimeoEmbedProps, LoomEmbedProps, WistiaEmbedProps }

// biome-ignore lint/suspicious/noExplicitAny: HOC generic needs flexible constraint
function withProGate<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  displayName: string
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) =>
    React.createElement(
      ProGate,
      { package: '@tour-kit/media', children: null } as unknown as React.ComponentProps<
        typeof ProGate
      >,
      React.createElement(Component, props)
    )
  Wrapped.displayName = `Licensed(${displayName})`
  return Wrapped
}

export const YouTubeEmbed = withProGate(_YouTubeEmbed, 'YouTubeEmbed')
export const VimeoEmbed = withProGate(_VimeoEmbed, 'VimeoEmbed')
export const LoomEmbed = withProGate(_LoomEmbed, 'LoomEmbed')
export const WistiaEmbed = withProGate(_WistiaEmbed, 'WistiaEmbed')

// ============================================
// NATIVE MEDIA
// ============================================

import { type GifPlayerProps, GifPlayer as _GifPlayer } from './gif-player'
import { type LottiePlayerProps, LottiePlayer as _LottiePlayer } from './lottie-player'
import { type NativeVideoProps, NativeVideo as _NativeVideo } from './native-video'

export type { NativeVideoProps, GifPlayerProps, LottiePlayerProps }

export const NativeVideo = withProGate(_NativeVideo, 'NativeVideo')
export const GifPlayer = withProGate(_GifPlayer, 'GifPlayer')
export const LottiePlayer = withProGate(_LottiePlayer, 'LottiePlayer')
