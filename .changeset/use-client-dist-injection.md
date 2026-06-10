---
'@tour-kit/react': patch
'@tour-kit/analytics': patch
'@tour-kit/hints': patch
'@tour-kit/announcements': patch
'@tour-kit/checklists': patch
'@tour-kit/license': patch
'@tour-kit/scheduling': patch
'@tour-kit/surveys': patch
'@tour-kit/media': patch
'@tour-kit/ai': patch
---

Ship the `'use client'` directive in published dists. tsup's `banner` option is
stripped by the rollup treeshake pass (and by `minify: true`), so every package
relying on it published client entries without the directive — importing them from a
Next.js App-Router Server Component evaluated React-stateful code in the react-server
layer and crashed `next build` with `createContext is not a function`. All client
entries now get the directive injected post-build (shared
`tooling/build/use-client.ts`); server-safe entries (`license/headless`,
`ai/server`, tailwind plugin entries) intentionally stay directive-free.

Also fixes `@tour-kit/media/tailwind` shipping without type declarations: the
package's second tsup config raced the first one's DTS step, which deleted
`dist/tailwind/index.d.ts` after it was emitted. Media now builds from a single
config.
