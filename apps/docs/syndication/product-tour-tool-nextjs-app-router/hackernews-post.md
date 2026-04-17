## Title: Product tour libraries tested against Next.js App Router – compatibility matrix

## URL: https://usertourkit.com/blog/product-tour-tool-nextjs-app-router

## Comment to post immediately after:

I tested 8 product tour libraries in a Next.js 15 + React 19 project because I kept seeing "just add 'use client'" as the universal answer, and that turned out to be incomplete.

The interesting finding: App Router's route-level code splitting, Suspense boundaries, and parallel routes all affect tour behavior in ways that aren't documented by any library. Elements can unmount between navigations, appear late due to streaming, or change URL without triggering a full page transition. Libraries that don't observe DOM changes lose track of tour targets.

Bundle size disparity is worth noting: React Joyride adds ~85 KB gzipped to the client bundle with no tree-shaking, while Driver.js manages ~5 KB. For reference, web.dev recommends keeping total JS under 300 KB gzipped for good Core Web Vitals on mobile.

Also worth flagging: Intro.js uses AGPL v3, which caught me off guard. Every other library on the list is MIT.

Disclosure: I built one of the libraries tested (Tour Kit), so take its placement with appropriate skepticism. The comparison data (bundle sizes, compatibility results) is verifiable against npm and bundlephobia.
