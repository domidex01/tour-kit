# @tour-kit/media

> React video & media embeds — YouTube, Vimeo, Loom, Wistia, HTML5, GIF, Lottie with captions and reduced-motion fallbacks.

[![npm version](https://img.shields.io/npm/v/@tour-kit/media.svg)](https://www.npmjs.com/package/@tour-kit/media)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/media.svg)](https://www.npmjs.com/package/@tour-kit/media)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/media?label=gzip)](https://bundlephobia.com/package/@tour-kit/media)
[![types](https://img.shields.io/npm/types/@tour-kit/media.svg)](https://www.npmjs.com/package/@tour-kit/media)

Auto-detecting **React video embeds** and **rich media** for product demos, onboarding videos, announcement modals, and feature walkthroughs. Pass any URL — TourMedia detects YouTube / Vimeo / Loom / Wistia / native HTML5 / GIF / Lottie and renders the right player with captions, responsive sources, and reduced-motion fallbacks.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Use this for:** product demo videos, onboarding walkthroughs (Loom-style), in-app feature explainers, animated illustrations (Lottie), GIF tutorials.

## Features

- **One component, many sources** — `<TourMedia src="..." />` auto-detects the type
- **Privacy-friendly YouTube** — uses `youtube-nocookie.com` for GDPR compliance
- **Responsive sources** — automatic source selection by viewport
- **Captions** — `<track>` element support for native video, embed CC params
- **Reduced motion** — auto-falls back to a static poster when `prefers-reduced-motion`
- **Lottie** — opt-in animated vector support (peer dep)
- **Headless variant** — `MediaHeadless` with render-prop API
- **Standalone** — does not depend on `@tour-kit/core`; embed in any React app
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/media @tour-kit/license
# or
pnpm add @tour-kit/media @tour-kit/license

# Optional: Lottie support
pnpm add @lottiefiles/react-lottie-player
```

## Quick Start

```tsx
import { LicenseProvider } from '@tour-kit/license'
import { TourMedia } from '@tour-kit/media'

function ProductDemo() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <TourMedia
        src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        title="Product walkthrough"
        autoplay
        muted
        captions={[{ src: '/captions/en.vtt', srclang: 'en', label: 'English' }]}
      />
    </LicenseProvider>
  )
}
```

`TourMedia` auto-detects the type from `src`. To skip detection, render an embed component directly:

```tsx
import { LoomEmbed, NativeVideo, GifPlayer } from '@tour-kit/media'

<LoomEmbed src="https://www.loom.com/share/abc123" />
<NativeVideo src="/intro.mp4" poster="/intro-poster.jpg" muted autoplay />
<GifPlayer src="/feature.gif" />
```

## Source detection

| Source | Patterns |
|---|---|
| YouTube | `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/` |
| Vimeo | `vimeo.com/123456`, `player.vimeo.com/video/` |
| Loom | `loom.com/share/`, `loom.com/embed/` |
| Wistia | `wistia.com/medias/`, `fast.wistia.net/embed/` |
| Native | `.mp4`, `.webm`, `.ogg` |
| GIF | `.gif` |
| Lottie | `.json` |

## Headless variant

```tsx
import { MediaHeadless } from '@tour-kit/media'

<MediaHeadless
  src="https://www.youtube.com/watch?v=..."
  render={({ parsed, isPlaying, play, pause }) => (
    <div>
      <h3>{parsed.type}</h3>
      <button onClick={isPlaying ? pause : play}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  )}
/>
```

## API Reference

### Components

| Export | Purpose |
|---|---|
| `TourMedia` | Auto-detecting media component (use this 90% of the time) |
| `YouTubeEmbed` | YouTube `nocookie` iframe |
| `VimeoEmbed` | Vimeo iframe |
| `LoomEmbed` | Loom iframe |
| `WistiaEmbed` | Wistia iframe |
| `NativeVideo` | HTML5 `<video>` element |
| `GifPlayer` | GIF with play/pause control |
| `LottiePlayer` | Lottie animation (peer dep required) |
| `MediaHeadless` | Render-prop variant of `TourMedia` |

### Hooks

| Hook | Description |
|---|---|
| `useMediaEvents(handlers)` | Subscribe to play / pause / ended / error events |
| `usePrefersReducedMotion()` | SSR-safe motion preference matcher |
| `useResponsiveSource(sources)` | Select the best source for the current viewport |

### URL utilities

```ts
import {
  // Detection
  parseMediaUrl,
  detectMediaType,
  isSupportedMediaUrl,
  isEmbedType,
  isNativeVideoType,
  supportsAutoplay,
  // Platform-specific
  isYouTubeUrl, isVimeoUrl, isLoomUrl, isWistiaUrl,
  extractYouTubeId, extractVimeoId, extractLoomId, extractWistiaId,
  // Embed URL builders
  buildYouTubeEmbedUrl, buildVimeoEmbedUrl, buildLoomEmbedUrl, buildWistiaEmbedUrl,
  // Thumbnails
  getYouTubeThumbnailUrl, getVimeoThumbnailUrl,
  // Responsive
  selectResponsiveSource, getSourceType,
} from '@tour-kit/media'
```

### Variants (CVA)

```ts
import {
  mediaContainerVariants,
  mediaOverlayVariants,
  playButtonVariants,
  iframeVariants,
} from '@tour-kit/media'
```

### Types

```ts
import type {
  AspectRatio,
  MediaType,                    // 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'native' | 'gif' | 'lottie'
  CaptionTrack,
  ResponsiveSource,
  ParsedMediaUrl,
  LottieOptions,
  TourMediaConfig,
  TourMediaProps,
  MediaHeadlessProps,
  MediaHeadlessRenderProps,
  MediaEventName,
  MediaEvent,
  MediaEventHandlers,
} from '@tour-kit/media'
```

## Gotchas

- **Autoplay needs `muted`** — Chrome, Safari, and Firefox all block unmuted autoplay. Pass `autoplay` *and* `muted` together.
- **Lottie is opt-in** — install `@lottiefiles/react-lottie-player` to use `LottiePlayer`.
- **`prefers-reduced-motion` falls back to a poster** — autoplaying video and animated GIFs become a static image when the user prefers reduced motion.
- **Standalone** — `@tour-kit/media` does **not** depend on `@tour-kit/core`. You can use it on its own.

## Related packages

- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — embed media in announcement modals / slideouts
- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — embed media in tour step content
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license validation

## Documentation

Full documentation: [https://usertourkit.com/docs/media](https://usertourkit.com/docs/media)

## License

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.
