---
title: "I tested 8 product tour libraries with Next.js App Router — here's what works"
published: false
description: "Every product tour library is client-side. App Router defaults to Server Components. I tested 8 libraries in a Next.js 15 + React 19 project to find which ones actually work."
tags: react, nextjs, javascript, webdev
canonical_url: https://usertourkit.com/blog/product-tour-tool-nextjs-app-router
cover_image: https://usertourkit.com/og-images/product-tour-tool-nextjs-app-router.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-tool-nextjs-app-router)*

# What product tour tool works with Next.js App Router?

Next.js App Router changed how React apps render. Server Components are the default now, Pages Router is in maintenance mode, and every product tour library on npm is a client-side tool that needs DOM access. That mismatch breaks things if you pick the wrong library or wire it up incorrectly.

We tested 8 product tour libraries in a Next.js 15 + React 19 + TypeScript 5.7 project to find which ones actually work with App Router out of the box, which ones need workarounds, and which ones cause hydration errors or "window is not defined" crashes.

## Short answer

User Tour Kit, Onborda, NextStepjs, and Driver.js all work with Next.js App Router when placed inside a `"use client"` boundary. Tour Kit is the only headless option with built-in App Router navigation adapters, typed step definitions, and WCAG 2.1 AA accessibility at under 8 KB gzipped for the core package. React Joyride and Shepherd.js work too, but both need extra configuration to avoid SSR errors and neither supports multi-route tours natively.

## How App Router changes the game for product tours

Every product tour library measures DOM elements, renders overlays, and listens for scroll events. None of that works in a Server Component. The fix is straightforward: wrap your tour provider in a `"use client"` component and import it in your root layout. This is the same pattern you use for auth providers, theme providers, or any React context.

But "put it in a client component" is only half the story. App Router also introduces:

- **Route-level code splitting** that can unmount your tour target between navigations
- **Streaming and Suspense boundaries** that delay when DOM elements appear
- **Parallel and intercepting routes** that change URL without a full page transition

Libraries that don't account for these patterns will lose track of tour targets mid-flow.

## Detailed comparison

| Library | App Router support | Architecture | Bundle size | Multi-route tours | License |
|---|---|---|---|---|---|
| User Tour Kit | Native: router adapters for next/navigation | Headless (you bring UI) | core <8 KB gzipped | Yes, built-in | MIT (free) + Pro |
| Onborda | Native: built for Next.js | Opinionated (Framer Motion + Radix) | Not published | Yes, MutationObserver | MIT |
| NextStepjs | Native: built for Next.js | Opinionated (Motion) | Not published | Yes, nextRoute/prevRoute props | MIT |
| OnboardJS | Documented "use client" pattern | Headless core + React hooks | Not published | Yes | Not specified |
| React Joyride | Requires "use client" wrapper | React component-driven | ~498 KB unpacked | Partial (community patches) | MIT |
| Shepherd.js | Requires dynamic import or "use client" | Vanilla JS + React wrapper | ~150 KB unpacked | Limited | MIT |
| Driver.js | Works in client components | Vanilla JS, no React bindings | ~5 KB gzipped | No built-in | MIT |
| Intro.js | Requires "use client" | Vanilla JS | ~25 KB gzipped | No built-in | AGPL v3 / Commercial |

Sources: npm registry, bundlephobia.com, GitHub repositories. As of April 2026.

## The "use client" pattern every library needs

Regardless of which library you pick, the setup in App Router follows the same shape:

```tsx
// src/providers/tour-provider.tsx
'use client';

import { TourProvider } from '@tourkit/react';
import { tourSteps } from '@/config/tour-steps';

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider
      tourId="onboarding"
      steps={tourSteps}
      options={{ scrollBehavior: 'smooth' }}
    >
      {children}
    </TourProvider>
  );
}
```

```tsx
// src/app/layout.tsx (Server Component, no "use client" needed here)
import { AppTourProvider } from '@/providers/tour-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppTourProvider>
          {children}
        </AppTourProvider>
      </body>
    </html>
  );
}
```

The gotcha we hit during testing: if you import a tour library at the top level of a Server Component file without the directive, Next.js throws `ReferenceError: window is not defined` during build. Shepherd.js is particularly prone to this because its React wrapper accesses `window` at import time, not just at render time.

## Decision framework

**Need full design control?** Pick a headless library. Tour Kit and OnboardJS both give you hooks and logic without prescribing markup.

**Want working tours in 15 minutes?** Onborda or NextStepjs ship pre-built components that look good immediately. The tradeoff: Framer Motion becomes a hard dependency (~32 KB gzipped).

**Already using React Joyride?** It works behind a `"use client"` boundary in App Router. But its 498 KB unpacked size is worth revisiting. (To be fair, Joyride has 340K+ weekly npm downloads and battle-tested reliability.)

**Only need single-page highlighting?** Driver.js at ~5 KB gzipped is hard to beat.

**Licensing matters?** Check Intro.js carefully. AGPL v3 requires you to open-source your application unless you buy a commercial license.

## Performance impact

We measured first-load JS impact by running `next build` with bundle analysis enabled:

- **Tour Kit core + react:** Added ~15 KB to the client bundle (gzipped). Tree-shakes unused features.
- **React Joyride:** Added ~85 KB (gzipped). No tree-shaking.
- **Onborda:** Added ~45 KB (gzipped) including Framer Motion.

Google's guidance on web.dev suggests keeping total JavaScript under 300 KB gzipped for good Core Web Vitals scores on mobile. A tour library that consumes 85 KB of that budget is harder to justify than one using 15 KB.

## FAQ

**Does any product tour library work as a React Server Component?**
No. Every library requires browser APIs that only work in Client Components.

**Which library is smallest for Next.js?**
Driver.js at ~5 KB gzipped (no React bindings). Tour Kit's core is under 8 KB gzipped with full React integration.

**Can I use React Joyride with App Router?**
Yes. Wrap it in `"use client"` and it works. Multi-route tours need extra state management.

**Is Shepherd.js compatible?**
Works but needs `next/dynamic` with `{ ssr: false }` to avoid SSR errors.

---

Full article with all code examples and comparison table: [usertourkit.com/blog/product-tour-tool-nextjs-app-router](https://usertourkit.com/blog/product-tour-tool-nextjs-app-router)

*Disclosure: I built Tour Kit. Every claim is verifiable against npm and GitHub.*
