# @tour-kit/media

Embedded video and media support for tours and announcements.

## URL Parsing

The package auto-detects media type from URLs:
- YouTube: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`
- Vimeo: `vimeo.com/123456`, `player.vimeo.com/video/`
- Loom: `loom.com/share/`, `loom.com/embed/`
- Wistia: `wistia.com/medias/`, `fast.wistia.net/embed/`
- File extensions: `.mp4`, `.webm`, `.ogg`, `.gif`, `.json`

## Architecture

```
types/
  media.ts         - TourMedia, MediaType, CaptionTrack
  events.ts        - Analytics event types

utils/
  parse-media-url.ts     - URL detection and parsing
  extract-video-id.ts    - Platform-specific ID extraction
  embed-urls.ts          - Embed URL builders
  responsive.ts          - Responsive source selection

components/
  tour-media.tsx         - Main component with auto-detection
  embeds/
    youtube-embed.tsx    - YouTube iframe embed
    vimeo-embed.tsx      - Vimeo iframe embed
    loom-embed.tsx       - Loom iframe embed
    wistia-embed.tsx     - Wistia iframe embed
    native-video.tsx     - HTML5 video element
    gif-player.tsx       - GIF with play/pause
    lottie-player.tsx    - Optional Lottie wrapper
  headless/
    media-headless.tsx   - Render prop version
```

## Gotchas

- **Autoplay**: Requires `muted: true` in most browsers
- **Lottie**: Optional peer dependency - check if available before using
- **YouTube Privacy**: Uses `youtube-nocookie.com` for GDPR compliance
- **Reduced Motion**: Falls back to poster/static image if `prefers-reduced-motion`

## Commands

```bash
pnpm --filter @tour-kit/media build
pnpm --filter @tour-kit/media typecheck
pnpm --filter @tour-kit/media test
```

## Related Rules
- `tour-kit/rules/components.md` - Component patterns
- `tour-kit/rules/accessibility.md` - A11y requirements
