---
title: "What is the best product tour library for SSR (server-side rendering)?"
slug: "best-product-tour-library-ssr"
canonical: https://usertourkit.com/blog/best-product-tour-library-ssr
tags: react, javascript, web-development, nextjs, ssr
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-product-tour-library-ssr)*

# What is the best product tour library for SSR (server-side rendering)?

Product tours have a fundamental problem with server-side rendering: they need the browser. Tooltips need `getBoundingClientRect()`. Overlays need `document.body`. State persistence needs `localStorage`. None of that exists on the server.

As of April 2026, 68% of new React projects use an SSR framework like Next.js, Remix, or Astro (State of JS 2025). Your tour library has to handle a rendering environment where the DOM doesn't exist during the first pass.

We tested five popular product tour libraries in a Next.js 15 App Router project with React Server Components enabled. Most broke during hydration. Some threw `window is not defined` errors. A few handled it gracefully.

## Short answer

User Tour Kit is the best product tour library for SSR because it ships zero server-side code, uses `"use client"` boundaries correctly, and adds less than 8KB gzipped to the client bundle. For teams not using React, Shepherd.js offers framework-agnostic SSR compatibility, though its AGPL license and 37KB bundle size are worth considering.

## Detailed comparison

| Library | SSR safe | RSC support | Hydration clean | Bundle (gzip) | License |
|---------|----------|-------------|-----------------|---------------|---------|
| User Tour Kit | Yes | Native `"use client"` | Zero mismatches | ~8KB | MIT |
| React Joyride | Partial | Requires wrapper | Warnings on mount | ~37KB | MIT |
| Shepherd.js | Yes (with config) | Manual boundary | Clean if lazy-loaded | ~37KB | AGPL-3.0 |
| Driver.js | Partial | Needs dynamic import | Flicker on first render | ~5KB | MIT |
| Intro.js | No | No | Hydration errors | ~17KB | AGPL-3.0 |

Full article with testing methodology, decision framework, and code examples: [usertourkit.com/blog/best-product-tour-library-ssr](https://usertourkit.com/blog/best-product-tour-library-ssr)
