## Thread (6 tweets)

**1/** Most product tour libraries break with SSR. I tested 5 of them in Next.js 15 App Router + React 19. Here's what actually happened:

**2/** Intro.js: Crashes the server. Accesses `document` at the module level. Dead on arrival for SSR.

React Joyride: Needs `next/dynamic` + `ssr: false`. Even then, hydration mismatch warnings. Tour loads 1-3s late.

**3/** Driver.js: Imports fine but flickers during hydration. At ~5KB it's the lightest option. Worth it if you can accept the visual glitch.

Shepherd.js: Works with lazy loading. But 37KB + AGPL license.

**4/** The root cause is always the same: tour libraries need `getBoundingClientRect()`, `document.body`, and `localStorage`. Access any of those at import time or during initial render = server crash or hydration mismatch.

**5/** Decision framework:
- Next.js App Router → Tour Kit (~8KB, native "use client")
- Remix/non-React SSR → Shepherd.js
- Smallest bundle → Driver.js (~5KB)
- Stuck on Joyride → next/dynamic wrapper

**6/** Full comparison table, testing methodology, and code examples: https://usertourkit.com/blog/best-product-tour-library-ssr

(Bias note: I built Tour Kit. Every claim is verifiable against npm and bundlephobia.)
