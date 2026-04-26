---
title: Media URL parsing
type: concept
sources:
  - ../packages/media/src/utils/parse-media-url.ts
  - ../packages/media/src/utils/extract-video-id.ts
  - ../packages/media/src/utils/embed-urls.ts
updated: 2026-04-26
---

*`@tour-kit/media` auto-detects media type from a URL string — no manual `type` prop needed for common cases.*

## Detection table

| Source | URL patterns |
|---|---|
| YouTube | `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/` |
| Vimeo | `vimeo.com/123456`, `player.vimeo.com/video/` |
| Loom | `loom.com/share/`, `loom.com/embed/` |
| Wistia | `wistia.com/medias/`, `fast.wistia.net/embed/` |
| Native video | `.mp4`, `.webm`, `.ogg` |
| GIF | `.gif` |
| Lottie | `.json` |

## Public utilities

```ts
parseMediaUrl(url)            → ParsedMediaUrl
detectMediaType(url)          → MediaType
isSupportedMediaUrl(url)      → boolean
isEmbedType(type)             → boolean
isNativeVideoType(type)       → boolean
supportsAutoplay(type)        → boolean
```

### Per-platform helpers

```ts
isYouTubeUrl, isVimeoUrl, isLoomUrl, isWistiaUrl
extractYouTubeId, extractVimeoId, extractLoomId, extractWistiaId
buildYouTubeEmbedUrl, buildVimeoEmbedUrl, buildLoomEmbedUrl, buildWistiaEmbedUrl
getYouTubeThumbnailUrl, getVimeoThumbnailUrl
```

`buildYouTubeEmbedUrl` uses `youtube-nocookie.com` for GDPR compliance.

## Responsive source selection

```ts
selectResponsiveSource(sources, viewport)   → ResponsiveSource
getSourceType(source)                       → MediaType
```

Picks the best source from a list given the viewport size — useful for serving `.webm` to capable browsers and `.mp4` as fallback, or different resolutions per breakpoint.

## Type aliases

```ts
type MediaType = 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'native' | 'gif' | 'lottie'
type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16' | string
```

## Gotchas

- **YouTube short links.** `youtu.be/` short URLs work, but the ID extraction differs from `?v=` URLs — always use `extractYouTubeId(url)` rather than parsing yourself.
- **Wistia channel URLs.** Only `/medias/` and `/embed/` patterns are recognized. Channel/playlist URLs aren't supported.
- **Lottie via JSON.** Auto-detected only when the URL ends in `.json`. Inline Lottie objects need `<LottiePlayer animationData={...} />` directly.

## Related

- [packages/media.md](../packages/media.md)
