# Which Product Tour Libraries Actually Work with Next.js App Router?

### I tested 8 libraries so you don't have to

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-tool-nextjs-app-router)*

Next.js App Router defaults to Server Components. Every product tour library requires browser APIs. That mismatch causes hydration errors, "window is not defined" crashes, and lost tour state during route transitions.

I tested 8 product tour libraries in a Next.js 15 + React 19 project. Here's what I found.

---

## The short version

Four libraries work natively: User Tour Kit, Onborda, NextStepjs, and Driver.js. All need a "use client" boundary, but they handle it cleanly.

React Joyride and Shepherd.js work with workarounds. Joyride needs a client wrapper. Shepherd.js needs dynamic imports because its React wrapper accesses window at import time.

Intro.js works but uses AGPL v3 licensing, which means you'd need to open-source your app or buy a commercial license.

## Why App Router makes this harder

"Just add 'use client'" is the common advice, and it's half right. But App Router also introduces route-level code splitting (your tour target can unmount between pages), Suspense boundaries (DOM elements appear late), and parallel routes (URL changes without full navigation).

Libraries that don't handle these patterns lose track of where the tour is supposed to point.

## What I measured

Bundle size impact using next build with analysis enabled:

Tour Kit added about 15 KB gzipped to the client bundle. React Joyride added roughly 85 KB. Onborda added about 45 KB including Framer Motion.

Google's web.dev guidance suggests keeping total JavaScript under 300 KB gzipped for good Core Web Vitals on mobile. An 85 KB tour library takes a real bite out of that budget.

## How to decide

If you want full design control and use Tailwind or shadcn/ui, pick a headless library like Tour Kit or OnboardJS.

If you want pre-built components that work in 15 minutes, Onborda or NextStepjs are good choices. Framer Motion becomes a required dependency.

If you already use React Joyride, it works behind a client boundary. But at 498 KB unpacked, new projects should probably look elsewhere.

If you only need single-page highlighting, Driver.js at 5 KB gzipped is the lightest option.

## The gotcha everyone hits

Import a tour library at the top of a Server Component file and Next.js throws ReferenceError: window is not defined during build. The fix: create a separate client component file for your tour provider and import that into your layout instead.

---

Full comparison table and code examples: [usertourkit.com/blog/product-tour-tool-nextjs-app-router](https://usertourkit.com/blog/product-tour-tool-nextjs-app-router)

*Disclosure: I built User Tour Kit. Every claim is verifiable against npm, GitHub, and bundlephobia.*

**Suggested Medium publications:** JavaScript in Plain English, Bits and Pieces, Better Programming
