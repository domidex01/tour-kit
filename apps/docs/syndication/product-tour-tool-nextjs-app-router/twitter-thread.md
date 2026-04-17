## Thread (6 tweets)

**1/** Every product tour library is client-side. Next.js App Router defaults to Server Components. I tested 8 libraries to see which ones actually work without breaking SSR.

**2/** The "just add 'use client'" advice is only half right. App Router also has:
- Route-level code splitting (unmounts tour targets)
- Suspense boundaries (delays element rendering)
- Parallel routes (URL changes without full navigation)

Libraries that ignore these lose track of where to point.

**3/** Bundle size reality check (gzipped, client bundle):
- Driver.js: ~5 KB
- Tour Kit: ~15 KB
- Onborda: ~45 KB (Framer Motion included)
- React Joyride: ~85 KB (no tree-shaking)

Google recommends <300 KB total JS for good Core Web Vitals.

**4/** Licensing gotcha: Intro.js is AGPL v3. That means you must open-source your app or buy a commercial license. Every other library on the list is MIT.

**5/** The winners for App Router:
- Headless + full control: Tour Kit, OnboardJS
- Quick pre-built setup: Onborda, NextStepjs
- Lightest possible: Driver.js
- Already invested: React Joyride (works with wrapper)

**6/** Full comparison table with code examples and bundle analysis:
https://usertourkit.com/blog/product-tour-tool-nextjs-app-router

(Disclosure: I built Tour Kit. Data is from npm/bundlephobia — verify it yourself.)
