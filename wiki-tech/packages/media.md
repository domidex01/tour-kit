---
title: "@tour-kit/media"
type: package
package: "@tour-kit/media"
version: 0.1.4
sources:
  - ../packages/media/CLAUDE.md
  - ../packages/media/package.json
  - ../packages/media/src/index.ts
updated: 2026-04-26
---

*Embedded video and rich media for tours and announcements. Auto-detects type from URL (YouTube, Vimeo, Loom, Wistia, native video, GIF, Lottie).*

## Identity

| | |
|---|---|
| Name | `@tour-kit/media` |
| Version | 0.1.4 |
| Tier | Pro (license-gated) |
| Deps | `@tour-kit/license`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Optional peers | `@lottiefiles/react-lottie-player`, `@mui/base` |

Note: `@tour-kit/core` is **not** a dependency — `@tour-kit/media` is standalone, embeddable in any component.

## URL detection

| Source | Patterns |
|---|---|
| YouTube | `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/` |
| Vimeo | `vimeo.com/123456`, `player.vimeo.com/video/` |
| Loom | `loom.com/share/`, `loom.com/embed/` |
| Wistia | `wistia.com/medias/`, `fast.wistia.net/embed/` |
| Native | `.mp4`, `.webm`, `.ogg` |
| GIF | `.gif` |
| Lottie | `.json` |

YouTube embeds use **`youtube-nocookie.com`** for GDPR compliance.

## Public API

### Main component

```ts
TourMedia                 // auto-detects type from `src` URL
TourMediaComponentProps
```

### Embed components

```ts
YouTubeEmbed, VimeoEmbed, LoomEmbed, WistiaEmbed   // iframe embeds
NativeVideo                                         // HTML5 video element
GifPlayer                                           // GIF with play/pause
LottiePlayer                                        // Lottie wrapper (optional dep)
```

Each has a `*Props` type alias.

### Headless

```ts
MediaHeadless   // render-prop variant of TourMedia
```

### Hooks

```ts
useMediaEvents(...)         → UseMediaEventsReturn
usePrefersReducedMotion()   // SSR-safe; falls back to false on server
useResponsiveSource(...)    // selects best source from a list given viewport
```

Types: `UseMediaEventsOptions`, `UseMediaEventsReturn`.

### Utilities

```ts
// Detection
parseMediaUrl, detectMediaType, isSupportedMediaUrl
isEmbedType, isNativeVideoType, supportsAutoplay

// Platform-specific
isYouTubeUrl, isVimeoUrl, isLoomUrl, isWistiaUrl
extractYouTubeId, extractVimeoId, extractLoomId, extractWistiaId

// Embed URL builders
buildYouTubeEmbedUrl, buildVimeoEmbedUrl, buildLoomEmbedUrl, buildWistiaEmbedUrl
EmbedUrlOptions

// Thumbnails
getYouTubeThumbnailUrl, getVimeoThumbnailUrl

// Responsive
selectResponsiveSource, getSourceType
```

### UI variants (CVA)

```ts
mediaContainerVariants, mediaOverlayVariants, playButtonVariants, iframeVariants
MediaContainerVariants, MediaOverlayVariants, PlayButtonVariants, IframeVariants
```

### Slot

```ts
cn, Slot, Slottable, UnifiedSlot, RenderProp, UnifiedSlotProps
UILibraryProvider, useUILibrary, UILibrary, UILibraryProviderProps
```

### Types

```ts
AspectRatio, MediaType, CaptionTrack, ResponsiveSource, ParsedMediaUrl,
LottieOptions, TourMediaConfig, TourMediaProps,
MediaHeadlessRenderProps, MediaHeadlessProps,
MediaEventName, MediaEvent, MediaEventHandlers
```

## Gotchas

- **Autoplay needs `muted: true`** in most browsers (Chrome, Safari, Firefox enforce this). Pass `autoplay` *and* `muted` together or autoplay silently fails.
- **Lottie is opt-in.** If you import `LottiePlayer`, install `@lottiefiles/react-lottie-player`. Without it, the component renders nothing.
- **`prefers-reduced-motion` fallback.** Auto-playing videos and animated GIFs fall back to a static poster when the user prefers reduced motion.

## Related

- [packages/license.md](license.md) — gating
- [packages/announcements.md](announcements.md) — common consumer (modal/slideout media)
- [concepts/url-parsing.md](../concepts/url-parsing.md)
