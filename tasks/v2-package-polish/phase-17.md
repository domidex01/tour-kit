# Phase 17 — Media Reliability

**Duration:** Days 89–93 (~8–12 hours)
**Depends on:** Nothing — `@tour-kit/media` self-contained additive surface; no upstream phase deliverables required.
**Blocks:** Nothing direct. Feeds the **M8** milestone gate (no demo embed lands without a finite fallback path + LCP-safe placeholder + a11y caption affordance).
**Risk Level:** MEDIUM — iframe loading behaves inconsistently on slow networks and on tracking-prevention browsers (Safari ITP, Brave); the 10s timeout + click-to-load default contain the blast radius, but they introduce two new render paths (`<MediaPlaceholder>` and the fallback link) that must not regress existing consumers. The Spotlight redesign-class visual change is also visible to demos already shipped on the docs site.
**Stack:** react

---

## Objective

Three additive improvements to `@tour-kit/media` that close the "infinite Loading video…" demo pain in `examples/dashboard-next/`:

1. **YouTube + Vimeo embeds gain a `loadStrategy` prop.** Default `'click-to-load'` renders a `<MediaPlaceholder>` poster and only inserts the `<iframe>` after the user clicks (privacy + perf — zero network calls to youtube-nocookie.com or vimeo.com before consent). `'auto'` matches today's behaviour (iframe renders immediately) but layers a **10s `setTimeout`** on top of the existing `isLoading` state; if `onLoad` hasn't fired by then, the spinner is replaced with a visible fallback (`"Couldn't load — Open in new tab"` link to the canonical video URL) and an `onTimeout?(reason: 'iframe-not-loaded')` callback fires.
2. **`<MediaPlaceholder src blurDataUrl width height />`** — LCP-safe poster surface for any embed. Fixed `aspect-ratio` via inline style (e.g., `16 / 9`) prevents CLS regardless of when the iframe loads. `blurDataUrl` is a base64 inline data URI rendered as a fast blur backdrop until the full poster paints. Framework-agnostic — uses a plain `<img>`, not Next.js Image (the docs consumer wraps with Next Image when desired).
3. **`<Caption>` + `<CaptionTrack>` slot for transcripts.** When the consumer passes `<CaptionTrack src=".vtt" srclang="en" label="English" />`, the caption is rendered as a native `<track kind="captions">` inside the underlying `<video>` element (only meaningful for `<NativeVideo>` — iframe embeds can't accept tracks). When the consumer passes plain `<Caption>{transcript text}</Caption>` (string children), it renders as a collapsible `<details><summary>Captions</summary><div>{text}</div></details>` accordion below the media. Both branches are screen-reader announced; the disclosure pattern satisfies WCAG 2.1 SC 1.2.2 (captions) for embed providers that don't expose VTT.

Bundle delta target: **<3KB gzipped** added to `@tour-kit/media` (placeholder is ~40 LOC, caption is ~30 LOC, embed deltas are ~60 LOC each — well within budget).

## What Success Looks Like

1. **Throttled-network Playwright test:** With `page.route('**/embed/**', route => setTimeout(() => route.abort(), 15000))` simulating an iframe that never loads, mounting `<YouTubeEmbed videoId="dQw4w9WgXcQ" loadStrategy="auto" title="Demo" />` shows a spinner that is **replaced by a visible fallback link** within 10s ± 500ms. Verified by `pnpm --filter @tour-kit/playwright test -- --grep "youtube timeout"` exiting 0; the assertion is `await expect(page.getByRole('link', { name: /open in new tab/i })).toBeVisible({ timeout: 12000 })`.
2. **CLS = 0 for a video-bearing tour step:** Lighthouse run against `apps/docs/content/docs/media/reliability.mdx` (which embeds a `<YouTubeEmbed>` wrapped in `<MediaPlaceholder>`) reports Cumulative Layout Shift = `0.000`. Verified by `pnpm --filter docs lighthouse:media-reliability` (new npm script) writing a JSON report whose `audits['cumulative-layout-shift'].numericValue === 0`.
3. **Click-to-load: no iframe before click.** Playwright test mounts `<YouTubeEmbed videoId="x" loadStrategy="click-to-load" title="t" />`, asserts `await expect(page.locator('iframe')).toHaveCount(0)`, clicks the placeholder, then asserts `await expect(page.locator('iframe')).toHaveCount(1)`. No network request to `*.youtube-nocookie.com` is observed via `page.on('request', ...)` until after the click.
4. **`<Caption>` accordion a11y:** RTL test renders `<Caption>Transcript text here.</Caption>`, asserts `screen.getByRole('button', { name: /captions/i })` is present (the `<summary>` element), clicks it, asserts the transcript text becomes visible, and runs `axe(container)` returning **zero violations**. Verified by `pnpm --filter @tour-kit/media test -- --run caption.a11y` exiting 0.
5. **`<CaptionTrack>` VTT path renders `<track>`:** Mounting `<NativeVideo src="x.mp4" ...><CaptionTrack src="captions.en.vtt" srclang="en" label="English" /></NativeVideo>` produces a `<video>` element containing a child `<track kind="captions" src="captions.en.vtt" srclang="en" label="English">` — verified by `container.querySelector('video > track[kind="captions"]')` being non-null.
6. **`onTimeout` callback fires with structured reason:** Vitest test using `vi.useFakeTimers()` mounts `<YouTubeEmbed loadStrategy="auto" onTimeout={mockFn} />`, advances 10000ms, asserts `mockFn` was called exactly once with `{ reason: 'iframe-not-loaded' }`.
7. **Bundle delta:** `pnpm --filter @tour-kit/media build` then `gzip -c dist/index.js | wc -c` produces a value ≤ pre-phase baseline + 3072 bytes (3KB). Captured by an existing size-limit gate or a one-off shell comparison logged in the PR.
8. **All existing media tests still pass:** `pnpm --filter @tour-kit/media test -- --run` exits 0 with zero regressions on existing `parse-media-url.test.ts`, `embed-urls.test.ts`, `detect-media-type.test.ts`, `media-slot.test.tsx`, and `license-integration.test.tsx`.
9. **Typecheck clean:** `pnpm --filter @tour-kit/media typecheck` exits 0; new `MediaPlaceholderProps`, `CaptionProps`, `CaptionTrackProps`, and `YouTubeEmbedProps`/`VimeoEmbedProps` extensions compile.
10. **Docs page renders:** `pnpm --filter docs build` exits 0; `/docs/media/reliability` appears in the sidebar under Media with runnable code blocks for all three features.

---

## Architecture / Key Design Decisions

```
                ┌─────────────────────────────────────────────────────────────┐
                │  <YouTubeEmbed loadStrategy="click-to-load" | "auto">        │
                │                                                              │
                │  loadStrategy="click-to-load" (DEFAULT):                     │
                │    initial render = <MediaPlaceholder src blurDataUrl />     │
                │    onClick → setHasClicked(true) → renders <iframe>          │
                │    zero network calls to youtube-nocookie.com before click   │
                │                                                              │
                │  loadStrategy="auto":                                        │
                │    immediate <iframe> render (current behaviour)             │
                │    + setTimeout(10_000) on mount                             │
                │    + if onLoad hasn't cleared isLoading by 10s →             │
                │        render fallback link + fire onTimeout?                │
                └─────────────────────────────────────────────────────────────┘
                                          ▲
                                          │
                ┌─────────────────────────────────────────────────────────────┐
                │  <MediaPlaceholder src blurDataUrl width height alt>         │
                │                                                              │
                │  inline style: aspect-ratio: <width> / <height>              │
                │  plain <img loading="lazy" decoding="async"> — no Next.js    │
                │  blurDataUrl rendered as a position-absolute backdrop until  │
                │  the high-res src paints (onLoad clears the blur)            │
                │                                                              │
                │  CLS = 0 because the wrapper has a fixed aspect ratio set    │
                │  BEFORE the image loads — layout reserved at first paint.    │
                └─────────────────────────────────────────────────────────────┘
                                          ▲
                                          │
                ┌─────────────────────────────────────────────────────────────┐
                │  <Caption> + <CaptionTrack>                                  │
                │                                                              │
                │  <CaptionTrack src=".vtt" srclang lang label>                │
                │     → rendered as <track kind="captions"> by <NativeVideo>   │
                │       (only meaningful for HTML5 <video>; iframe embeds      │
                │        warn-once-in-dev that VTT is unsupported)             │
                │                                                              │
                │  <Caption>{string text}</Caption>                            │
                │     → renders as <details><summary>Captions</summary>        │
                │       <div role="region" aria-label="Transcript">{text}      │
                │       </div></details>                                       │
                │     → keyboard-toggleable via Enter/Space on <summary>       │
                │     → screen reader announces expanded/collapsed state       │
                └─────────────────────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `YouTubeEmbedProps.loadStrategy` / `VimeoEmbedProps.loadStrategy` | union literal `'click-to-load' \| 'auto'` | Closed set, default `'click-to-load'`; consumers cannot drift into unsupported strings |
| `YouTubeEmbedProps.onTimeout` / `VimeoEmbedProps.onTimeout` | `(args: { reason: 'iframe-not-loaded' }) => void` | Discriminated reason object — leaves room to add new reasons (e.g., `'cookie-blocked'` in Phase 18+) without a breaking signature change |
| `MediaPlaceholderProps` | exported `interface` | Consumer-facing component; structural typing keeps Storybook composition cheap |
| `CaptionProps` (text) and `CaptionTrackProps` (VTT) | exported `interface`s; mirror `CaptionTrack` from `types/media.ts` for VTT fields | The existing `CaptionTrack` type in `types/media.ts` is the source of truth; `CaptionTrackProps` extends it with optional ref/className |
| Timeout constant | `const MEDIA_LOAD_TIMEOUT_MS = 10_000` exported from `lib/timeouts.ts` | Pinned for tests to import; any drift on the 10s contract is a single-line edit |

**Critical rules for this phase:**

- **`loadStrategy` default is `'click-to-load'`, not `'auto'`.** This is the privacy + perf default. Existing consumers must explicitly opt into the old behaviour by passing `loadStrategy="auto"` — call out the migration in the CHANGELOG (additive, not strictly breaking because the old `<YouTubeEmbed>` rendered an iframe immediately; the new default does not. We're documenting this as a "patch-bump worthy default change" in the same minor version because no public type changes; if QA proves it breaks a consumer, escalate to a minor with the old default preserved behind `'auto'`).
- **10s timeout uses `setTimeout`, not `requestAnimationFrame` or `IntersectionObserver`.** The contract is wall-clock time from mount, not visibility time. Cleared in `useEffect` cleanup. Cleared in the existing `onLoad` callback (success) and `onError` callback (failure).
- **No new keyframes.** Existing `animate-pulse` (Tailwind utility) on the loading spinner satisfies the three-tier reduced-motion defense because `tailwindcss-animate`'s `animate-pulse` is generally OK under `prefers-reduced-motion: reduce` (it's a low-stimulus opacity pulse, not motion). The new placeholder blur transition uses `motion-safe:transition-opacity` so it disables under reduce per CLAUDE.md §Reduced motion.
- **`<MediaPlaceholder>` is plain `<img>` — never Next.js Image.** The media package must stay framework-agnostic. The docs MDX is free to wrap with `next/image` when it imports the component, but the package itself ships zero `next/*` dependencies. Verified by a grep test (`grep -c "from 'next" packages/media/src/components/media-placeholder.tsx` returns 0).
- **`<Caption>` text branch uses native `<details>`/`<summary>`.** No Radix UI Collapsible, no custom state — `<details>` is keyboard-accessible by default and announces correctly in NVDA + VoiceOver. The `<summary>` element is implicitly `role="button"` with toggle state; RTL queries it via `getByRole('button', { name: /captions/i })`.
- **`<CaptionTrack>` is render-only for `<NativeVideo>`.** When a consumer passes `<CaptionTrack>` as a child of `<YouTubeEmbed>` / `<VimeoEmbed>` / `<LoomEmbed>` / `<WistiaEmbed>`, the iframe embed emits a one-time dev `console.warn` (`[tour-kit/media] CaptionTrack is only supported with <NativeVideo>; iframe embeds rely on the provider's own caption UI`) and renders nothing. `<NativeVideo>` filters its children for `CaptionTrack` instances (`React.Children.toArray(children).filter(child => isValidElement(child) && child.type === CaptionTrack)`) and emits each one as a `<track>` inside the `<video>` element.
- **No new libraries.** Everything uses existing primitives — `React.useEffect` for the timeout, native `<details>` for the accordion, plain `<img>` for the placeholder. No Context7 lookups needed.

---

## Tasks

### Task 17.1 — `loadStrategy` + 10s timeout fallback on YouTube + Vimeo embeds (3–4 h)

**Depends on:** —

Extend `packages/media/src/components/embeds/youtube-embed.tsx` and `packages/media/src/components/embeds/vimeo-embed.tsx` with:

1. New props on each `*EmbedProps` interface:

```ts
// Add to YouTubeEmbedProps and VimeoEmbedProps (identical shape)
/**
 * Iframe load strategy.
 * - 'click-to-load' (DEFAULT): render <MediaPlaceholder> first; insert iframe only on click.
 *   Zero network calls to the embed provider before consent.
 * - 'auto': render iframe immediately on mount (legacy behaviour). Pairs with a 10s
 *   timeout that swaps the spinner for a visible fallback link when the iframe never
 *   fires `load`.
 */
loadStrategy?: 'click-to-load' | 'auto'
/**
 * Fires when `loadStrategy="auto"` and the iframe has not loaded after MEDIA_LOAD_TIMEOUT_MS.
 * Receives a discriminated reason object; only `'iframe-not-loaded'` is emitted today.
 */
onTimeout?: (args: { reason: 'iframe-not-loaded' }) => void
/**
 * Optional poster URL passed through to <MediaPlaceholder> when loadStrategy="click-to-load".
 * Defaults to YouTube's `https://i.ytimg.com/vi/{videoId}/maxresdefault.jpg` for YouTube,
 * and to Vimeo's oEmbed thumbnail fetched once (cached) on mount for Vimeo. If the consumer
 * passes `poster`, that takes priority.
 */
poster?: string
/** Optional base64 inline data URI for fast blur-up paint */
blurDataUrl?: string
```

2. Add `packages/media/src/lib/timeouts.ts` (NEW):

```ts
/** Wall-clock timeout (ms) before iframe load is considered failed and fallback renders. */
export const MEDIA_LOAD_TIMEOUT_MS = 10_000
```

3. Implementation pattern for both embeds — the existing `isLoading` state stays; layer a `hasTimedOut` state and effect on top:

```tsx
// Add inside the existing component body (YouTubeEmbed shown; Vimeo is identical with provider strings swapped):

import { MEDIA_LOAD_TIMEOUT_MS } from '../../lib/timeouts'
import { MediaPlaceholder } from '../media-placeholder'

const {
  loadStrategy = 'click-to-load',
  poster,
  blurDataUrl,
  onTimeout,
  ...rest
} = props

const [hasClicked, setHasClicked] = React.useState(loadStrategy === 'auto')
const [hasTimedOut, setHasTimedOut] = React.useState(false)

// Effective poster — YouTube has a deterministic thumbnail; Vimeo we let the consumer pass it
const resolvedPoster = poster ?? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`

// Wall-clock 10s timeout — only when iframe is mounted (post-click or strategy === 'auto')
React.useEffect(() => {
  if (!hasClicked || !isLoading) return
  const handle = window.setTimeout(() => {
    setHasTimedOut(true)
    onTimeout?.({ reason: 'iframe-not-loaded' })
  }, MEDIA_LOAD_TIMEOUT_MS)
  return () => window.clearTimeout(handle)
}, [hasClicked, isLoading, onTimeout])

// Canonical "open in new tab" URL — full youtube.com/watch link so users land on the public page
const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`

// Pre-click: render placeholder only (click-to-load default)
if (!hasClicked) {
  return (
    <button
      type="button"
      onClick={() => setHasClicked(true)}
      className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), 'group cursor-pointer', className)}
      aria-label={`Play ${title}`}
    >
      <MediaPlaceholder
        src={resolvedPoster}
        blurDataUrl={blurDataUrl}
        width={16}
        height={9}
        alt={title}
      />
      {/* Existing play-button overlay — reuse playButtonVariants from media-variants.ts */}
      <span className={cn(playButtonVariants({ size: 'md' }), 'absolute inset-0 m-auto')}>
        <PlayIcon aria-hidden="true" />
      </span>
    </button>
  )
}

// Post-click (or auto) + timed out: render fallback link
if (hasTimedOut) {
  return (
    <div className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-4 text-center">
        <p className="mb-2 text-sm text-muted-foreground">
          Couldn&apos;t load video.
        </p>
        <a
          href={canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline underline-offset-2"
        >
          Open in new tab
        </a>
      </div>
    </div>
  )
}

// Post-click + still loading or loaded: existing render path (unchanged)
return (
  <div className={cn(mediaContainerVariants({ aspectRatio, size, rounded }), className)}>
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
        <span className="sr-only">Loading video...</span>
      </div>
    )}
    <iframe
      ref={ref}
      src={embedUrl}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      className={cn(iframeVariants({ loading: isLoading }))}
      onLoad={handleLoad}
      onError={handleError}
    />
  </div>
)
```

Vimeo embed mirrors this exactly. Vimeo's canonical URL is `https://vimeo.com/${videoId}`. The Vimeo poster default URL requires an oEmbed lookup (`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`) — to keep this phase additive, **do not** fetch oEmbed by default; require the consumer to pass `poster` for Vimeo, and if they don't, the `<MediaPlaceholder>` renders with `src=""` + `blurDataUrl` (the blur backdrop alone, with a centred play button). Document this in `reliability.mdx`.

**Sanity check:** `pnpm --filter @tour-kit/media typecheck` exits 0; `pnpm --filter @tour-kit/media test -- --run youtube-timeout` exits 0 with the fake-timer test passing.

---

### Task 17.2 — `<MediaPlaceholder>` component (2–3 h)

**Depends on:** —

Create `packages/media/src/components/media-placeholder.tsx`:

```tsx
'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'

export interface MediaPlaceholderProps {
  /** Image source URL (poster / thumbnail). Optional — if absent, only the blur backdrop paints. */
  src?: string
  /** Base64 inline data URI for fast blur-up paint. Recommended size: 10x6 px. */
  blurDataUrl?: string
  /** Aspect ratio numerator (e.g., 16). */
  width: number
  /** Aspect ratio denominator (e.g., 9). */
  height: number
  /** Required alt text for accessibility. */
  alt: string
  /** Additional CSS class name on the wrapper. */
  className?: string
}

/**
 * LCP-safe poster surface for media embeds. The wrapper has a fixed `aspect-ratio`
 * style set BEFORE the image loads, so the browser reserves layout space at first paint —
 * Cumulative Layout Shift (CLS) for any embed wrapped in MediaPlaceholder is 0.
 *
 * The `blurDataUrl` backdrop paints instantly (base64 inline) and the high-res `src`
 * crossfades in once `onLoad` fires.
 *
 * Framework-agnostic — uses a plain <img>. Consumers can wrap with `next/image`
 * in their own code if they want; the package does not depend on next.
 */
export const MediaPlaceholder = React.forwardRef<HTMLDivElement, MediaPlaceholderProps>(
  ({ src, blurDataUrl, width, height, alt, className }, ref) => {
    const [hasLoaded, setHasLoaded] = React.useState(false)

    // Fixed aspect ratio reserves layout before any image paints — kills CLS at the root.
    const wrapperStyle: React.CSSProperties = {
      aspectRatio: `${width} / ${height}`,
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
    }

    return (
      <div ref={ref} style={wrapperStyle} className={cn('bg-muted', className)}>
        {blurDataUrl && (
          <img
            src={blurDataUrl}
            alt=""
            aria-hidden="true"
            // Filter cheaply blurs the tiny inline image up to full size
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity motion-safe:duration-300',
              hasLoaded ? 'opacity-0' : 'opacity-100'
            )}
            style={{ filter: 'blur(20px)', transform: 'scale(1.05)' }}
          />
        )}
        {src && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setHasLoaded(true)}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity motion-safe:duration-300',
              hasLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}
      </div>
    )
  }
)

MediaPlaceholder.displayName = 'MediaPlaceholder'
```

Re-export from `packages/media/src/components/index.ts` (create if missing — currently the package re-exports from `src/index.ts` directly; add `MediaPlaceholder` and its props type there).

**Sanity check:** `pnpm --filter @tour-kit/media test -- --run media-placeholder.cls` exits 0; the JSDOM test asserts the wrapper element has `style.aspectRatio === '16 / 9'` before the image loads.

---

### Task 17.3 — `<Caption>` + `<CaptionTrack>` slots (2–3 h)

**Depends on:** —

Create `packages/media/src/components/caption.tsx` with two exports:

```tsx
'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'

export interface CaptionTrackProps {
  /** URL to the WebVTT caption file (.vtt). SRT is NOT supported by the native <track> element. */
  src: string
  /** BCP 47 language code (e.g., 'en', 'es', 'fr'). */
  srclang: string
  /** Human-readable label shown in the browser's caption menu. */
  label: string
  /** Whether this track is selected by default. */
  default?: boolean
}

export interface CaptionProps {
  /** Transcript text or React node to render inside the collapsible accordion. */
  children: React.ReactNode
  /** Override the default "Captions" summary label. */
  summary?: string
  /** Whether the accordion is open by default. */
  defaultOpen?: boolean
  /** Additional CSS class name on the <details> element. */
  className?: string
}

/**
 * Native VTT track marker. Rendered as <track kind="captions"> by <NativeVideo>;
 * iframe embeds (YouTube/Vimeo/Loom/Wistia) emit a one-time dev warn and ignore it
 * (provider has its own caption UI).
 *
 * This component intentionally renders NOTHING when used standalone — it's a marker
 * consumed by <NativeVideo>'s children scan via React.Children.toArray + type check.
 */
export const CaptionTrack: React.FC<CaptionTrackProps> = () => null
CaptionTrack.displayName = 'CaptionTrack'

/**
 * Transcript accordion using native <details>/<summary> — keyboard-accessible by
 * default, announces expanded/collapsed state to NVDA + VoiceOver.
 *
 * Use this when your embed provider does not expose VTT (e.g., YouTube iframe
 * relies on the player's own CC button — but providing a text transcript alongside
 * still satisfies WCAG 2.1 SC 1.2.2 / 1.2.3).
 */
export const Caption = React.forwardRef<HTMLDetailsElement, CaptionProps>(
  ({ children, summary = 'Captions', defaultOpen = false, className }, ref) => (
    <details
      ref={ref}
      open={defaultOpen}
      className={cn(
        'mt-2 rounded-md border border-border bg-muted/30 p-3 text-sm',
        className
      )}
    >
      <summary className="cursor-pointer select-none font-medium">{summary}</summary>
      <div role="region" aria-label="Transcript" className="mt-2 leading-relaxed">
        {children}
      </div>
    </details>
  )
)
Caption.displayName = 'Caption'
```

Update `packages/media/src/components/embeds/native-video.tsx` to scan children for `CaptionTrack` instances and emit `<track>` elements:

```tsx
// Inside <NativeVideo>'s render, near the existing <video> element:
const captionTracks = React.Children.toArray(children).filter(
  (child): child is React.ReactElement<CaptionTrackProps> =>
    React.isValidElement(child) && child.type === CaptionTrack
)

// Inside <video>:
{captionTracks.map((track, i) => (
  <track
    key={`${track.props.srclang}-${i}`}
    kind="captions"
    src={track.props.src}
    srcLang={track.props.srclang}
    label={track.props.label}
    default={track.props.default}
  />
))}
```

Update each iframe embed (`youtube-embed.tsx`, `vimeo-embed.tsx`, `loom-embed.tsx`, `wistia-embed.tsx`) to emit the one-time dev warn if a `CaptionTrack` is found in `children`. Helper in `packages/media/src/lib/warn-once.ts` (NEW):

```ts
const warned = new Set<string>()
export function warnOnce(key: string, message: string): void {
  if (warned.has(key) || process.env.NODE_ENV === 'production') return
  warned.add(key)
  // eslint-disable-next-line no-console
  console.warn(`[tour-kit/media] ${message}`)
}
```

Re-export `Caption`, `CaptionTrack`, `CaptionProps`, `CaptionTrackProps` from `packages/media/src/index.ts`.

**Sanity check:** `pnpm --filter @tour-kit/media test -- --run caption.a11y` exits 0; running `axe(container)` on a rendered `<Caption>Transcript text.</Caption>` returns zero violations.

---

### Task 17.4 — Tests + Playwright fixture + docs page (1–2 h)

**Depends on:** 17.1, 17.2, 17.3

Add the following test files:

1. **`packages/media/src/__tests__/youtube-timeout.test.tsx`** — Vitest with `vi.useFakeTimers()`. Three cases:
   - Mount `<YouTubeEmbed videoId="x" title="t" loadStrategy="auto" onTimeout={mockFn} />`. Advance 10000ms. Assert `mockFn` called once with `{ reason: 'iframe-not-loaded' }`. Assert `screen.getByRole('link', { name: /open in new tab/i })` is present with `href="https://www.youtube.com/watch?v=x"`.
   - Mount with `loadStrategy="auto"`. Fire `iframe`'s `onLoad` after 5000ms. Advance to 11000ms. Assert `mockFn` was NOT called (timeout cleared on successful load).
   - Mount with `loadStrategy="click-to-load"` (default). Assert `screen.queryByRole('iframe')` is null. Click the placeholder button. Assert iframe is now in the DOM. Advance timers — placeholder click did NOT immediately fire `onLoad`, so after 10000ms the timeout fires.

2. **`packages/media/src/__tests__/media-placeholder.cls.test.tsx`** — RTL. Three cases:
   - Render `<MediaPlaceholder src="x.jpg" width={16} height={9} alt="poster" />`. Query the wrapper div. Assert `getComputedStyle(wrapper).aspectRatio === '16 / 9'` (JSDOM may return `auto` for `getComputedStyle` — fall back to reading `wrapper.style.aspectRatio` directly).
   - Render without `src` but with `blurDataUrl`. Assert the blur `<img>` is in the DOM with `aria-hidden="true"`.
   - Render with both `src` and `blurDataUrl`. Fire `onLoad` on the full `<img>`. Assert the blur image has `opacity-0` class.

3. **`packages/media/src/__tests__/caption.a11y.test.tsx`** — RTL + `vitest-axe`. Three cases:
   - Render `<Caption>Transcript text here.</Caption>`. Assert `getByRole('button', { name: /captions/i })` is present (native `<summary>` exposes implicit button role). Click. Assert transcript text is visible. Run `axe(container)` — zero violations.
   - Render `<NativeVideo src="x.mp4" controls><CaptionTrack src="en.vtt" srclang="en" label="English" /></NativeVideo>`. Assert `container.querySelector('video > track[kind="captions"][src="en.vtt"][srclang="en"]')` is non-null.
   - Render `<YouTubeEmbed videoId="x" title="t"><CaptionTrack src="en.vtt" srclang="en" label="English" /></YouTubeEmbed>`. Spy `console.warn`. Assert warn was called exactly once with a message containing `'CaptionTrack is only supported with <NativeVideo>'`. (NOTE: existing `YouTubeEmbedProps` does not accept `children` — extend the interface in Task 17.1 to optionally accept `React.ReactNode` children so the `CaptionTrack` filter has a place to land. Same for Vimeo/Loom/Wistia embeds.)

4. **Playwright fixture in `packages/playwright/`** — new test `tests/media-reliability.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('YouTube embed: throttled network swaps to fallback link within 10s', async ({ page }) => {
  // Block all youtube-nocookie iframe loads so the iframe never fires `load`
  await page.route('**/youtube-nocookie.com/**', (route) => {
    // Hang indefinitely — simulates an iframe that never loads
    return new Promise(() => {})
  })

  await page.goto('/fixtures/media-reliability')  // existing fixtures-app fixture page
  await page.getByRole('button', { name: /play demo video/i }).click()  // click-to-load → activate iframe

  // Within 10s + 2s buffer the fallback link must appear
  await expect(page.getByRole('link', { name: /open in new tab/i })).toBeVisible({ timeout: 12_000 })
  await expect(page.getByRole('link', { name: /open in new tab/i })).toHaveAttribute('href', /youtube\.com\/watch\?v=/)
})

test('YouTube embed: click-to-load renders zero iframes before click', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (req) => requests.push(req.url()))

  await page.goto('/fixtures/media-reliability')

  // Before click: no iframe, no youtube-nocookie request
  await expect(page.locator('iframe')).toHaveCount(0)
  expect(requests.some((u) => u.includes('youtube-nocookie.com'))).toBe(false)

  await page.getByRole('button', { name: /play demo video/i }).click()

  await expect(page.locator('iframe')).toHaveCount(1)
})
```

Add a corresponding fixture page in `packages/playwright/fixtures-app/` (`app/fixtures/media-reliability/page.tsx` if Next App Router; mirror the existing fixtures-app conventions — check what's there before adding).

5. **`apps/docs/content/docs/media/reliability.mdx`** — new docs page with three H2 sections (`Click-to-load embeds`, `LCP-safe placeholders with <MediaPlaceholder>`, `Transcripts with <Caption>`). Each section has a runnable `tsx` code block + an inline live preview (the docs site already supports MDX live previews via existing patterns). Frontmatter: `title: Media reliability`, `description: Click-to-load embeds, LCP-safe placeholders, and accessible transcripts for @tour-kit/media.`. Slot into `apps/docs/content/docs/media/meta.json` (or the equivalent — match the existing media docs sidebar pattern).

**Sanity check:** `pnpm --filter @tour-kit/media test -- --run` exits 0 (all new tests + zero regressions); `pnpm --filter @tour-kit/playwright test -- --grep "media-reliability"` exits 0; `pnpm --filter docs build` exits 0 with the new page visible in the sidebar.

---

## Deliverables

```
packages/media/
├── src/
│   ├── components/
│   │   ├── embeds/
│   │   │   ├── youtube-embed.tsx           # UPDATED — loadStrategy + onTimeout + 10s effect + children scan for CaptionTrack (warn)
│   │   │   ├── vimeo-embed.tsx             # UPDATED — same pattern as YouTube; no default poster (requires consumer poster)
│   │   │   ├── loom-embed.tsx              # UPDATED — children scan for CaptionTrack (warn only; no timeout/loadStrategy this phase)
│   │   │   ├── wistia-embed.tsx            # UPDATED — children scan for CaptionTrack (warn only)
│   │   │   └── native-video.tsx            # UPDATED — children scan for CaptionTrack → emits <track kind="captions">
│   │   ├── media-placeholder.tsx           # NEW — LCP-safe wrapper with fixed aspect-ratio + blur backdrop
│   │   └── caption.tsx                     # NEW — Caption (accordion) + CaptionTrack (VTT marker)
│   ├── lib/
│   │   ├── timeouts.ts                     # NEW — exported MEDIA_LOAD_TIMEOUT_MS = 10_000
│   │   └── warn-once.ts                    # NEW — dev-only console.warn helper, gated by process.env.NODE_ENV
│   ├── index.ts                            # UPDATED — re-exports MediaPlaceholder, Caption, CaptionTrack + their Props types
│   └── __tests__/
│       ├── youtube-timeout.test.tsx        # NEW — 3 cases: auto+timeout, auto+load-clears-timeout, click-to-load gate
│       ├── media-placeholder.cls.test.tsx  # NEW — 3 cases: aspect-ratio set, blur w/o src, crossfade on load
│       └── caption.a11y.test.tsx           # NEW — 3 cases: text accordion + axe, VTT track emitted by NativeVideo, iframe warn

packages/playwright/
├── tests/
│   └── media-reliability.spec.ts           # NEW — 2 cases: throttled-network fallback within 10s, click-to-load no-iframe-before-click
└── fixtures-app/
    └── (new fixture page wiring matching existing conventions — exact path depends on the fixtures-app router)

apps/docs/
└── content/docs/media/
    ├── reliability.mdx                     # NEW — three H2 sections with runnable code blocks
    └── meta.json                           # UPDATED — sidebar entry slotted into media section
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/media typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/media test -- --run youtube-timeout` exits 0 with ≥3 passing cases (auto+timeout fires once, onLoad clears the timeout, click-to-load renders zero iframes pre-click)
- [ ] `pnpm --filter @tour-kit/media test -- --run media-placeholder.cls` exits 0 with ≥3 passing cases (aspect-ratio inline style present pre-load, blur-only path, crossfade opacity flip on load)
- [ ] `pnpm --filter @tour-kit/media test -- --run caption.a11y` exits 0 with ≥3 passing cases (text accordion axe-clean, VTT track emitted by `<NativeVideo>`, iframe embed warns once on `<CaptionTrack>` child)
- [ ] All existing media tests still pass: `pnpm --filter @tour-kit/media test -- --run` exits 0 with zero regressions on `parse-media-url`, `embed-urls`, `detect-media-type`, `media-slot`, `license-integration`
- [ ] `pnpm --filter @tour-kit/playwright test -- --grep "media-reliability"` exits 0 with both Playwright cases passing (throttled-network fallback within 10s ± 500ms; click-to-load DOM contains zero `iframe` elements and zero `youtube-nocookie.com` network requests before click)
- [ ] Lighthouse CLS audit on `/docs/media/reliability` returns `audits['cumulative-layout-shift'].numericValue === 0` (run `pnpm --filter docs lighthouse:media-reliability` or document the manual run + JSON path in PR description)
- [ ] Bundle delta: `gzip -c packages/media/dist/index.js | wc -c` ≤ pre-phase baseline + 3072 bytes (PR description logs both numbers)
- [ ] `pnpm --filter docs build` exits 0 AND `/docs/media/reliability` renders in the sidebar under Media with all three runnable code blocks present
- [ ] `grep -c "from 'next" packages/media/src/components/media-placeholder.tsx` returns `0` (framework-agnostic guarantee)
- [ ] `MEDIA_LOAD_TIMEOUT_MS` is exported from `@tour-kit/media` and imported by the timeout test (`import { MEDIA_LOAD_TIMEOUT_MS } from '@tour-kit/media/lib/timeouts'`) so a future drift of the 10s contract breaks the test loudly

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 17 of Tour Kit v2 Package Polish — Media Reliability.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest, vitest-axe, Playwright (in the `packages/playwright/` package with a Next.js `fixtures-app/`), pnpm. `@tour-kit/media` provides embed components for YouTube, Vimeo, Loom, Wistia, native `<video>`, GIF, and optional Lottie.

### Established in Prior Phases
- The package layout under `packages/media/src/components/embeds/` uses filenames `youtube-embed.tsx`, `vimeo-embed.tsx`, `loom-embed.tsx`, `wistia-embed.tsx`, `native-video.tsx`, `gif-player.tsx`, `lottie-player.tsx` (NOT `youtube.tsx`). The big-plan abbreviates the names; the real files are `*-embed.tsx`. Match the existing naming.
- The existing `<YouTubeEmbed>` (lines 38–102 of `packages/media/src/components/embeds/youtube-embed.tsx`) uses `useState(isLoading)` cleared by `onLoad`/`onError`. There is **no existing timeout** — task 17.1 layers one on top.
- The existing `iframeVariants` cva (in `packages/media/src/components/ui/media-variants.ts`) uses `loading: 'opacity-0' | 'opacity-100'` and is exported. Reuse it; do not duplicate.
- `CaptionTrack` already exists as a *type* in `packages/media/src/types/media.ts` (lines 24–33): `{ src, srclang, label, default? }`. Phase 17 introduces a *component* of the same name; the component's `CaptionTrackProps` must extend (or structurally match) the existing type so types/media.ts stays the source of truth.
- The package re-exports from `packages/media/src/index.ts`. There is no `src/components/index.ts` barrel today — add re-exports directly to `src/index.ts`.
- Reduced motion: per `CLAUDE.md` §Reduced motion, use `motion-safe:` Tailwind prefix on any `transition-*` utility (the placeholder's crossfade uses `motion-safe:transition-opacity motion-safe:duration-300` so it stays an instant flip under `prefers-reduced-motion: reduce`).
- No new libraries needed. `setTimeout`, `<details>/<summary>`, plain `<img>` cover everything.

### Your Goal for This Phase
1. Add `loadStrategy?: 'click-to-load' | 'auto'` (default `'click-to-load'`), `onTimeout?: (args: { reason: 'iframe-not-loaded' }) => void`, optional `poster` + `blurDataUrl` to `<YouTubeEmbed>` and `<VimeoEmbed>`. `'click-to-load'` renders `<MediaPlaceholder>` and only inserts an `<iframe>` after click — zero network calls to the embed provider before consent. `'auto'` layers a 10s `setTimeout` on top of the existing `isLoading` state; if `onLoad` hasn't fired by then, replace the spinner with a fallback link to the canonical video URL and fire `onTimeout`.
2. Ship `<MediaPlaceholder src blurDataUrl width height alt>` — framework-agnostic LCP-safe wrapper using an inline `aspect-ratio` style (kills CLS at first paint) + plain `<img>` (no `next/image` import).
3. Ship `<Caption>` (text → native `<details>/<summary>` accordion) and `<CaptionTrack>` (VTT marker → rendered as `<track kind="captions">` by `<NativeVideo>`'s children scan; iframe embeds warn-once-in-dev and ignore).
4. Tests + Playwright fixture + a new `apps/docs/content/docs/media/reliability.mdx` page.

### Data Model Rules (follow exactly)
- **Union literal:** `loadStrategy?: 'click-to-load' | 'auto'` on `YouTubeEmbedProps` and `VimeoEmbedProps`. Closed set; default `'click-to-load'`.
- **Discriminated reason object:** `onTimeout?: (args: { reason: 'iframe-not-loaded' }) => void`. Reason is an explicit object literal — never a bare string — so future reasons can be added without a breaking signature.
- **`const` (exported):** `MEDIA_LOAD_TIMEOUT_MS = 10_000` lives in `packages/media/src/lib/timeouts.ts`. Tests import it.
- **`interface` (exported):** `MediaPlaceholderProps`, `CaptionProps`, `CaptionTrackProps` live in their respective component files. `CaptionTrackProps` must structurally match the existing `CaptionTrack` type in `types/media.ts` (same fields: `src`, `srclang`, `label`, `default?`).
- **No new Zod schemas this phase.** No external validation boundary is crossed.
- **No new keyframes.** Existing `animate-pulse` covers the spinner; the placeholder crossfade uses `motion-safe:transition-opacity` per CLAUDE.md §Reduced motion.
- **Framework-agnostic placeholder.** `<MediaPlaceholder>` MUST use plain `<img>`. `grep -c "from 'next" packages/media/src/components/media-placeholder.tsx` MUST return 0.
- **`<CaptionTrack>` renders nothing standalone.** It's a marker scanned by `<NativeVideo>`. Iframe embeds emit `console.warn` once in dev when they find one in `children` (use the new `warn-once.ts` helper).

### Architecture
```
@tour-kit/media (additive surface)
  src/lib/timeouts.ts                          ← MEDIA_LOAD_TIMEOUT_MS = 10_000
  src/lib/warn-once.ts                         ← dev-only console.warn helper

  src/components/media-placeholder.tsx         ← NEW; aspect-ratio style + blur backdrop + plain <img>
  src/components/caption.tsx                   ← NEW; Caption (details/summary), CaptionTrack (() => null marker)

  src/components/embeds/youtube-embed.tsx      ← UPDATED; loadStrategy default 'click-to-load' + 10s timeout + onTimeout + warn on <CaptionTrack> child
  src/components/embeds/vimeo-embed.tsx        ← UPDATED; same pattern; canonical URL https://vimeo.com/{videoId}; no default poster
  src/components/embeds/loom-embed.tsx         ← UPDATED; warn-once on <CaptionTrack> child (no timeout/loadStrategy this phase)
  src/components/embeds/wistia-embed.tsx       ← UPDATED; warn-once on <CaptionTrack> child
  src/components/embeds/native-video.tsx       ← UPDATED; scans children for <CaptionTrack> and emits <track kind="captions">

  src/index.ts                                 ← re-exports MediaPlaceholder, Caption, CaptionTrack + Props types + MEDIA_LOAD_TIMEOUT_MS
```

### Confirmed Library APIs

No new libraries. Existing patterns to reference verbatim:

**`React.useEffect` + `window.setTimeout` (cleared in cleanup and on success):**

```tsx
React.useEffect(() => {
  if (!hasClicked || !isLoading) return
  const handle = window.setTimeout(() => {
    setHasTimedOut(true)
    onTimeout?.({ reason: 'iframe-not-loaded' })
  }, MEDIA_LOAD_TIMEOUT_MS)
  return () => window.clearTimeout(handle)
}, [hasClicked, isLoading, onTimeout])
```

**Fixed `aspect-ratio` inline style — kills CLS at first paint:**

```tsx
const wrapperStyle: React.CSSProperties = {
  aspectRatio: `${width} / ${height}`,
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
}
```

**Native `<details>/<summary>` — accessible by default:**

```tsx
<details>
  <summary className="cursor-pointer select-none">Captions</summary>
  <div role="region" aria-label="Transcript">{children}</div>
</details>
```

**`React.Children.toArray` + type filter — VTT marker scan inside `<NativeVideo>`:**

```tsx
const captionTracks = React.Children.toArray(children).filter(
  (child): child is React.ReactElement<CaptionTrackProps> =>
    React.isValidElement(child) && child.type === CaptionTrack
)
// Inside <video>:
{captionTracks.map((t, i) => (
  <track key={`${t.props.srclang}-${i}`} kind="captions" src={t.props.src}
         srcLang={t.props.srclang} label={t.props.label} default={t.props.default} />
))}
```

### Files to Create / Update

#### `packages/media/src/lib/timeouts.ts` (NEW)
One export: `export const MEDIA_LOAD_TIMEOUT_MS = 10_000`. Add a JSDoc comment noting this is the wall-clock timeout for iframe load before fallback renders.

#### `packages/media/src/lib/warn-once.ts` (NEW)
Module-scope `const warned = new Set<string>()` + `export function warnOnce(key: string, message: string): void`. Gate on `process.env.NODE_ENV !== 'production'`. Emit `console.warn('[tour-kit/media] ' + message)`.

#### `packages/media/src/components/media-placeholder.tsx` (NEW)
Export `MediaPlaceholder` (forwardRef on `HTMLDivElement`) + `MediaPlaceholderProps` interface. Props: `src?`, `blurDataUrl?`, `width: number`, `height: number`, `alt: string`, `className?`. Wrapper has inline `style={{ aspectRatio: \`${width} / ${height}\`, position: 'relative', width: '100%', overflow: 'hidden' }}`. Render blur `<img aria-hidden="true">` with `filter: blur(20px); transform: scale(1.05)` and `motion-safe:transition-opacity` crossfade. Render high-res `<img loading="lazy" decoding="async" onLoad={() => setHasLoaded(true)}>` with `motion-safe:transition-opacity`. Both images positioned `absolute inset-0 h-full w-full object-cover`. Use `cn` from `@tour-kit/core`. Plain `<img>` only — no `next/image`.

#### `packages/media/src/components/caption.tsx` (NEW)
Two exports: `Caption` (forwardRef on `HTMLDetailsElement`) and `CaptionTrack` (`React.FC<CaptionTrackProps>` returning `null`). `CaptionProps`: `children: React.ReactNode`, `summary?: string` (default `'Captions'`), `defaultOpen?: boolean`, `className?: string`. `CaptionTrackProps`: `src: string`, `srclang: string`, `label: string`, `default?: boolean`. `Caption` renders `<details><summary>{summary}</summary><div role="region" aria-label="Transcript">{children}</div></details>`. `CaptionTrack` is a render-nothing marker (`return null`); set `.displayName = 'CaptionTrack'` so the children-scan in `<NativeVideo>` can match by `child.type === CaptionTrack`.

#### `packages/media/src/components/embeds/youtube-embed.tsx` (UPDATED)
Extend `YouTubeEmbedProps` with `loadStrategy?`, `onTimeout?`, `poster?`, `blurDataUrl?`, `children?: React.ReactNode`. Default `loadStrategy = 'click-to-load'`. Add `hasClicked` state initialised to `loadStrategy === 'auto'`. Add `hasTimedOut` state. Add `useEffect` running the 10s timer when `hasClicked && isLoading`. Pre-click branch: render a `<button>` wrapping `<MediaPlaceholder src={resolvedPoster} blurDataUrl={blurDataUrl} width={16} height={9} alt={title} />` + the existing `playButtonVariants` overlay. `resolvedPoster = poster ?? \`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg\``. Post-click + timed-out branch: render the existing container with a centred fallback (`"Couldn't load video."` + `<a href={\`https://www.youtube.com/watch?v=${videoId}\`} target="_blank" rel="noopener noreferrer">Open in new tab</a>`). Post-click + still loading/loaded branch: existing render path unchanged. Scan `children` for `<CaptionTrack>` instances and `warnOnce(\`youtube-${videoId}-vtt\`, 'CaptionTrack is only supported with <NativeVideo>; iframe embeds rely on the provider\\'s own caption UI')` on each.

#### `packages/media/src/components/embeds/vimeo-embed.tsx` (UPDATED)
Mirror YouTube exactly. Canonical URL: `https://vimeo.com/${videoId}`. **No default poster** — if consumer doesn't pass `poster`, `<MediaPlaceholder>` renders with `src` undefined (just the blur backdrop + play button). Document this in `reliability.mdx`.

#### `packages/media/src/components/embeds/loom-embed.tsx` (UPDATED) and `wistia-embed.tsx` (UPDATED)
Scope this phase narrowly: add the `children` prop + `<CaptionTrack>` warn-once scan. Do NOT add `loadStrategy` or timeout to these embeds this phase (out of scope per big-plan §17.1 wording — YouTube + Vimeo only).

#### `packages/media/src/components/embeds/native-video.tsx` (UPDATED)
Add the children scan + `<track kind="captions">` emission as shown in "Confirmed Library APIs" above. Import `CaptionTrack` from `'../caption'`.

#### `packages/media/src/index.ts` (UPDATED)
Re-export: `MediaPlaceholder`, type `MediaPlaceholderProps`, `Caption`, `CaptionTrack`, type `CaptionProps`, type `CaptionTrackProps`, `MEDIA_LOAD_TIMEOUT_MS` (from `./lib/timeouts`).

#### `packages/media/src/__tests__/youtube-timeout.test.tsx` (NEW)
Vitest with `vi.useFakeTimers()`. Three cases as listed under Task 17.4. Use `@testing-library/react` (existing dep). Mock `console.warn` via `vi.spyOn(console, 'warn').mockImplementation(() => {})` in the warn-related test.

#### `packages/media/src/__tests__/media-placeholder.cls.test.tsx` (NEW)
RTL. Three cases as listed under Task 17.4. JSDOM's `getComputedStyle` may not resolve `aspect-ratio` — fall back to reading `wrapper.style.aspectRatio` directly (`expect(wrapper.style.aspectRatio).toBe('16 / 9')`).

#### `packages/media/src/__tests__/caption.a11y.test.tsx` (NEW)
RTL + `vitest-axe` (existing devDep). Three cases as listed under Task 17.4. The native `<summary>` element has implicit ARIA `role="button"` — use `getByRole('button', { name: /captions/i })`.

#### `packages/playwright/tests/media-reliability.spec.ts` (NEW)
Two cases as listed under Task 17.4. Use `page.route('**/youtube-nocookie.com/**', () => new Promise(() => {}))` to hang iframe loads. Check `packages/playwright/playwright.config.ts` for the base URL convention.

#### `packages/playwright/fixtures-app/` (UPDATED)
Add a fixture page exposing `<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Demo video" loadStrategy="click-to-load" />`. Check the existing fixtures-app routing (Next App Router or Pages Router — read `packages/playwright/fixtures-app/package.json` and one existing fixture page to match the convention before creating yours). Route path: `/fixtures/media-reliability`.

#### `apps/docs/content/docs/media/reliability.mdx` (NEW)
Frontmatter: `title: Media reliability`, `description: Click-to-load embeds, LCP-safe placeholders, and accessible transcripts for @tour-kit/media.`. Three H2 sections:
1. **Click-to-load embeds** — code block showing `<YouTubeEmbed videoId="..." title="..." loadStrategy="click-to-load" />` and explaining the privacy/perf benefit; second code block showing `loadStrategy="auto"` + `onTimeout` callback usage with the 10s contract called out (`MEDIA_LOAD_TIMEOUT_MS` constant referenced).
2. **LCP-safe placeholders with `<MediaPlaceholder>`** — code block standalone usage + integration example wrapping a custom embed; CLS=0 guarantee explained.
3. **Transcripts with `<Caption>`** — code block showing the text-accordion path; second code block showing `<CaptionTrack>` as a child of `<NativeVideo>`; note that iframe embeds emit a dev warn for `<CaptionTrack>` (provider's own caption UI is the path there).

#### `apps/docs/content/docs/media/meta.json` (UPDATED)
Add `"reliability"` to the `pages` array (slot alphabetically or after the existing index entry per the project convention).

### Success Criteria
- `pnpm --filter @tour-kit/media typecheck` exits 0
- `pnpm --filter @tour-kit/media test -- --run` exits 0 (all new + zero regressions)
- `pnpm --filter @tour-kit/playwright test -- --grep "media-reliability"` exits 0
- `pnpm --filter docs build` exits 0; `/docs/media/reliability` visible in sidebar
- `grep -c "from 'next" packages/media/src/components/media-placeholder.tsx` returns 0 (framework-agnostic guarantee)
- Bundle delta ≤ +3KB gzipped on `packages/media/dist/index.js` (logged in PR description with before/after byte counts)
- Lighthouse CLS audit on `/docs/media/reliability` returns numericValue 0

### Expected File Structure at End
```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── ...
├── phase-16.md
└── phase-17.md

packages/media/src/
├── lib/
│   ├── timeouts.ts                         # NEW
│   └── warn-once.ts                        # NEW
├── components/
│   ├── media-placeholder.tsx               # NEW
│   ├── caption.tsx                         # NEW
│   └── embeds/
│       ├── youtube-embed.tsx               # UPDATED
│       ├── vimeo-embed.tsx                 # UPDATED
│       ├── loom-embed.tsx                  # UPDATED
│       ├── wistia-embed.tsx                # UPDATED
│       └── native-video.tsx                # UPDATED
├── index.ts                                # UPDATED — re-exports
└── __tests__/
    ├── youtube-timeout.test.tsx            # NEW
    ├── media-placeholder.cls.test.tsx      # NEW
    └── caption.a11y.test.tsx               # NEW

packages/playwright/
├── tests/media-reliability.spec.ts         # NEW
└── fixtures-app/                           # UPDATED — new fixture page

apps/docs/content/docs/media/
├── reliability.mdx                         # NEW
└── meta.json                               # UPDATED
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — no upstream phase deliverables required (phase is self-contained additive surface in `@tour-kit/media`); existing source-of-truth files (`youtube-embed.tsx` lines 38–102, `vimeo-embed.tsx` lines 36–100, `types/media.ts` lines 24–33 `CaptionTrack`, `ui/media-variants.ts` `iframeVariants`/`playButtonVariants`) are cited with line ranges; filename convention discrepancy between big-plan (`youtube.tsx`) and the real repo (`youtube-embed.tsx`) is called out explicitly in the Execution Prompt.
- [PASS] Every sub-task has a clear, testable completion condition — each of 17.1–17.4 has a `Sanity check` one-liner combining `typecheck` + a targeted `vitest --run <pattern>` (plus Playwright `--grep` for 17.4); the `MEDIA_LOAD_TIMEOUT_MS` constant is imported by tests so any drift breaks CI.
- [PASS] Execution prompt is self-contained — all snippets pasted inline (useEffect+setTimeout pattern, aspectRatio inline style, `<details>/<summary>` accessible accordion, `React.Children.toArray` filter for `<CaptionTrack>`); data model rules listed (union literal, discriminated reason object, `const` constant, exported interfaces, no Zod, framework-agnostic placeholder); per-file guidance has one paragraph per file in the deliverables tree; success criteria are observable shell commands.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree appears in at least one exit checkbox (typecheck, targeted vitest, Playwright grep, docs build, or grep guard); bundle delta and Lighthouse CLS=0 are independent exit checks; the framework-agnostic guarantee has its own `grep -c "from 'next"` check; the `MEDIA_LOAD_TIMEOUT_MS` import contract is its own line.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 17. Vitest `vi.useFakeTimers()` handles the 10s timeout test deterministically without real-time sleeping. Playwright `page.route(..., () => new Promise(() => {}))` simulates an iframe that never loads — no real network throttling needed. `vitest-axe` runs in-process (existing devDep). No model/GPU mocking needed.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase. `React.useEffect` + `window.setTimeout`, native `<details>/<summary>`, plain `<img>`, `React.Children.toArray` are all existing language/framework primitives already used elsewhere in the repo. Per task instructions, skipping Context7 lookup is explicitly authorised. Marked PASS.
