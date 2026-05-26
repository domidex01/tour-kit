import plugin from 'tailwindcss/plugin'

/**
 * TourKit Media Tailwind CSS Plugin
 *
 * `@tour-kit/media` renders embeds with a `relative` aspect-ratio container and
 * an `absolute inset-0` iframe/video child. If the consumer's Tailwind `content`
 * globs do not scan `@tour-kit/media`'s `dist`, those layout utilities get
 * purged — the aspect-ratio collapses to `auto`/`height: 0` and every embed is
 * invisible.
 *
 * This plugin force-emits the layout-critical utilities the embeds depend on
 * (they are added through the plugin API, so they are never subject to
 * content-based purging), mirroring `tourKitPlugin` (`@tour-kit/react`) and
 * `hintsPlugin` (`@tour-kit/hints`). Add it to your Tailwind `plugins` (or use
 * {@link tourKitMediaPreset}) and embeds render correctly without having to add
 * the package's `dist` to your `content` globs.
 *
 * For runtime-computed `aspect-[w/h]` values that cannot be statically
 * extracted, also spread {@link mediaSafelist} into your config's `safelist`.
 *
 * Compatible with Tailwind CSS v3 and v4.
 *
 * @example
 * // tailwind.config.ts
 * import { mediaPlugin } from '@tour-kit/media/tailwind'
 *
 * export default {
 *   plugins: [mediaPlugin],
 * }
 */
export const mediaPlugin: ReturnType<typeof plugin> = plugin(({ addUtilities }) => {
  addUtilities({
    // Aspect ratios emitted by `mediaContainerVariants` — the load-bearing
    // utilities. Without these the container has no intrinsic height and the
    // absolutely-positioned embed collapses to 0px.
    '.aspect-video': { 'aspect-ratio': '16 / 9' },
    '.aspect-square': { 'aspect-ratio': '1 / 1' },
    '.aspect-\\[4\\/3\\]': { 'aspect-ratio': '4 / 3' },
    '.aspect-\\[9\\/16\\]': { 'aspect-ratio': '9 / 16' },
    '.aspect-\\[21\\/9\\]': { 'aspect-ratio': '21 / 9' },

    // Container + child positioning the embeds rely on. The container
    // establishes the positioning context; the iframe/video/img fills it.
    '.relative': { position: 'relative' },
    '.absolute': { position: 'absolute' },
    '.inset-0': { inset: '0' },
    '.h-full': { height: '100%' },
    '.w-full': { width: '100%' },
    '.overflow-hidden': { overflow: 'hidden' },
    '.border-0': { 'border-width': '0' },
    '.object-cover': { 'object-fit': 'cover' },
  })
})

export default mediaPlugin
