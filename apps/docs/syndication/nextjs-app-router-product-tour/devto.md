---
title: "Adding a product tour to your Next.js App Router project"
published: false
description: "A step-by-step guide to integrating userTourKit into Next.js 15. Covers Server Component boundaries, client-side tour providers, multi-page routing, and headless tooltip rendering."
tags: react, nextjs, webdev, tutorial
canonical_url: https://usertourkit.com/blog/nextjs-app-router-product-tour
cover_image: https://usertourkit.com/og-images/nextjs-app-router-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/nextjs-app-router-product-tour)*

# Adding a product tour to your Next.js App Router project

Next.js App Router splits your application into Server Components and Client Components, which breaks most product tour libraries that expect a fully client-rendered tree. userTourKit is a headless React tour library (core under 8KB gzipped) that works inside `'use client'` boundaries without touching your Server Component layout.

## Install the packages

```bash
npm install @tourkit/core @tourkit/react
```

## Create a client-side tour provider

The App Router defaults every component to a Server Component. Tour logic requires browser APIs, so the provider must live inside a `'use client'` boundary.

```tsx
// src/components/tour-provider.tsx
'use client'

import { TourProvider } from '@tourkit/react'

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider
      tourId="onboarding"
      persist="localStorage"
      steps={[
        {
          id: 'sidebar',
          target: '[data-tour="sidebar"]',
          title: 'Navigation',
          content: 'Use the sidebar to switch between sections.',
        },
        {
          id: 'search',
          target: '[data-tour="search"]',
          title: 'Search',
          content: 'Find anything in your workspace.',
        },
      ]}
    >
      {children}
    </TourProvider>
  )
}
```

## Wrap your layout

```tsx
// src/app/layout.tsx
import { AppTourProvider } from '@/components/tour-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppTourProvider>{children}</AppTourProvider>
      </body>
    </html>
  )
}
```

Server Components nested inside `AppTourProvider` stay server-rendered. The `'use client'` boundary does not force everything below it to become client code.

## Render the tour tooltip

userTourKit is headless -- you decide what the tooltip looks like.

```tsx
// src/components/tour-tooltip.tsx
'use client'

import { useTour } from '@tourkit/react'

export function TourTooltip() {
  const { currentStep, isActive, next, prev, stop, progress } = useTour()
  if (!isActive || !currentStep) return null

  return (
    <div className="fixed z-50 rounded-lg border bg-white p-4 shadow-lg"
         role="dialog" aria-label={currentStep.title}>
      <h3 className="font-semibold">{currentStep.title}</h3>
      <p className="mt-1 text-sm text-gray-600">{currentStep.content}</p>
      <div className="mt-3 flex justify-between">
        <button onClick={prev}>Back</button>
        <button onClick={next}>{progress.isLast ? 'Done' : 'Next'}</button>
      </div>
    </div>
  )
}
```

## Multi-page tours with the App Router

For tours spanning multiple routes, use the router adapter:

```tsx
import { TourProvider, useNextAppRouter } from '@tourkit/react'

export function AppTourProvider({ children }) {
  const router = useNextAppRouter()
  return (
    <TourProvider tourId="onboarding" router={router} steps={[
      { id: 'dashboard', target: '[data-tour="main"]', route: '/dashboard' },
      { id: 'settings', target: '[data-tour="form"]', route: '/settings' },
    ]}>
      {children}
    </TourProvider>
  )
}
```

The `useNextAppRouter()` hook wraps `useRouter()` and `usePathname()` from `next/navigation`.

| Feature | userTourKit | React Joyride | Onborda |
|---------|------------|---------------|---------|
| App Router compatible | Yes | Partial | Yes (Next.js only) |
| Headless (no default CSS) | Yes | No | No |
| Multi-page tours | Yes (any router) | No | Yes (Next.js only) |
| Bundle size (gzipped) | ~8KB + ~4KB | ~15KB | ~8KB + Framer Motion |

Full article with interactive examples: [usertourkit.com/blog/nextjs-app-router-product-tour](https://usertourkit.com/blog/nextjs-app-router-product-tour)
