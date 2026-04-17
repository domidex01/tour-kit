## Subreddit: r/nextjs (cross-post to r/reactjs)

**Title:** I tested 8 product tour libraries with Next.js App Router — here's a compatibility breakdown

**Body:**

I spent a day testing every major product tour library in a Next.js 15 + React 19 project to see which ones actually work with App Router without fighting SSR.

Quick findings:

**Works natively:** Onborda, NextStepjs, and Driver.js all handle "use client" boundaries cleanly. Tour Kit (which I built, full disclosure) also works natively with a next/navigation router adapter.

**Works with workarounds:** React Joyride needs a "use client" wrapper but functions fine. Shepherd.js needs dynamic imports because its React wrapper accesses window at import time — you'll get "window is not defined" errors otherwise.

**Watch out for:** Intro.js uses AGPL v3 licensing. Route-level code splitting can unmount tour targets between navigations, which breaks libraries that don't observe DOM changes. Suspense boundaries delay when elements appear, so tours that target elements inside a Suspense boundary may fire before the element exists.

**Bundle sizes (gzipped, client bundle):**
- Tour Kit: ~15 KB
- Onborda: ~45 KB (includes Framer Motion)
- React Joyride: ~85 KB (no tree-shaking)

The "just add use client" advice you see everywhere is only half the answer. App Router's code splitting, streaming, and parallel routes all affect tour behavior in ways that aren't obvious until you test them.

Full article with comparison table and code examples: https://usertourkit.com/blog/product-tour-tool-nextjs-app-router

Happy to answer questions about any specific library. And yeah, I'm biased since I built Tour Kit, so take that part with a grain of salt.
