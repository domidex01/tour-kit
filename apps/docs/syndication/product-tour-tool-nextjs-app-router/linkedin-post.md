Every product tour library on npm is client-side. Next.js App Router defaults to Server Components. That mismatch breaks things.

I tested 8 libraries in a Next.js 15 + React 19 project and found that "just add 'use client'" is only half the answer. App Router's code splitting, Suspense boundaries, and parallel routes all affect tour behavior in ways most documentation ignores.

The bundle size spread is striking: React Joyride adds ~85 KB gzipped to your client bundle with no tree-shaking. Driver.js manages ~5 KB. Google recommends under 300 KB total for good mobile performance.

One gotcha that surprises teams: Intro.js uses AGPL v3 licensing, requiring you to open-source your application unless you purchase a commercial license. Every other library tested is MIT.

Full comparison table with code examples and bundle analysis: https://usertourkit.com/blog/product-tour-tool-nextjs-app-router

(I built one of the tested libraries, Tour Kit. All data points are from npm and bundlephobia.)

#nextjs #react #javascript #webdevelopment #opensource #productdevelopment
