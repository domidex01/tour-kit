---
"@tour-kit/media": minor
---

Add a `@tour-kit/media/tailwind` entry point (`mediaPlugin`, `mediaSafelist`,
`tourKitMediaPreset`) so embeds are never invisible.

Previously, if a consumer's Tailwind `content` globs did not scan
`@tour-kit/media`'s `dist`, the aspect-ratio and positioning utilities the
embeds rely on were purged — the container collapsed to `height: 0` and every
iframe/video rendered invisibly. `mediaPlugin` force-emits those layout
utilities (and the five supported aspect ratios) through the plugin API, so
they survive purging without adding the package to `content` globs, mirroring
`@tour-kit/react`'s `tourKitPlugin` and `@tour-kit/hints`'s `hintsPlugin`.
`mediaSafelist` covers runtime-computed `aspect-[w/h]` arbitrary values.
