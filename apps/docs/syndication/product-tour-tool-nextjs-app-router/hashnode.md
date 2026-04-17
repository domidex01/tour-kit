---
title: "What product tour tool works with Next.js App Router?"
slug: "product-tour-tool-nextjs-app-router"
canonical: https://usertourkit.com/blog/product-tour-tool-nextjs-app-router
tags: react, nextjs, javascript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-tool-nextjs-app-router)*

# What product tour tool works with Next.js App Router?

Next.js App Router changed how React apps render. Server Components are the default now, Pages Router is in maintenance mode, and every product tour library on npm is a client-side tool that needs DOM access. That mismatch breaks things if you pick the wrong library or wire it up incorrectly.

We tested 8 product tour libraries in a Next.js 15 + React 19 + TypeScript 5.7 project to find which ones actually work with App Router out of the box, which ones need workarounds, and which ones cause hydration errors or "window is not defined" crashes.

## Short answer

User Tour Kit, Onborda, NextStepjs, and Driver.js all work with Next.js App Router when placed inside a `"use client"` boundary. Tour Kit is the only headless option with built-in App Router navigation adapters, typed step definitions, and WCAG 2.1 AA accessibility at under 8 KB gzipped. React Joyride and Shepherd.js work too, but both need extra configuration to avoid SSR errors.

## Comparison table

| Library | App Router support | Architecture | Bundle size | Multi-route tours | License |
|---|---|---|---|---|---|
| User Tour Kit | Native: router adapters | Headless | core <8 KB gzipped | Yes, built-in | MIT + Pro |
| Onborda | Native: built for Next.js | Opinionated (Framer Motion) | Not published | Yes | MIT |
| NextStepjs | Native: built for Next.js | Opinionated (Motion) | Not published | Yes | MIT |
| React Joyride | Requires "use client" | React component-driven | ~498 KB unpacked | Partial | MIT |
| Shepherd.js | Requires dynamic import | Vanilla JS + React wrapper | ~150 KB unpacked | Limited | MIT |
| Driver.js | Works in client components | Vanilla JS | ~5 KB gzipped | No | MIT |
| Intro.js | Requires "use client" | Vanilla JS | ~25 KB gzipped | No | AGPL v3 |

## The "use client" pattern

Every library needs the same setup:

```tsx
// src/providers/tour-provider.tsx
'use client';

import { TourProvider } from '@tourkit/react';
import { tourSteps } from '@/config/tour-steps';

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider tourId="onboarding" steps={tourSteps}>
      {children}
    </TourProvider>
  );
}
```

```tsx
// src/app/layout.tsx
import { AppTourProvider } from '@/providers/tour-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppTourProvider>{children}</AppTourProvider>
      </body>
    </html>
  );
}
```

## Decision framework

- **Need design control?** Headless library (Tour Kit, OnboardJS)
- **Want quick setup?** Onborda or NextStepjs (pre-built components)
- **Already on React Joyride?** It works, but 498 KB unpacked is worth reconsidering
- **Single-page only?** Driver.js at ~5 KB gzipped
- **Watch licensing:** Intro.js is AGPL v3

## Bundle size impact

- Tour Kit: ~15 KB gzipped in client bundle
- React Joyride: ~85 KB gzipped
- Onborda: ~45 KB gzipped (includes Framer Motion)

Full article with all code examples: [usertourkit.com/blog/product-tour-tool-nextjs-app-router](https://usertourkit.com/blog/product-tour-tool-nextjs-app-router)

*Disclosure: I built Tour Kit. Every claim is verifiable against npm and GitHub.*
