---
title: "How to add a product tour to a Next.js App Router project"
slug: "nextjs-app-router-product-tour"
canonical: https://usertourkit.com/blog/nextjs-app-router-product-tour
tags: react, nextjs, web-development, tutorial
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/nextjs-app-router-product-tour)*

# How to add a product tour to a Next.js App Router project

Next.js App Router splits your application into Server Components and Client Components, which breaks most product tour libraries that expect a fully client-rendered tree. userTourKit is a headless React tour library (core under 8KB gzipped) that works inside `'use client'` boundaries without touching your Server Component layout.

## Install

```bash
npm install @tourkit/core @tourkit/react
```

## Create a client-side tour provider

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
        { id: 'sidebar', target: '[data-tour="sidebar"]', title: 'Navigation', content: 'Use the sidebar to switch between sections.' },
        { id: 'search', target: '[data-tour="search"]', title: 'Search', content: 'Find anything in your workspace.' },
      ]}
    >
      {children}
    </TourProvider>
  )
}
```

## Wrap your root layout

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

## Render headless tour tooltip

```tsx
// src/components/tour-tooltip.tsx
'use client'
import { useTour } from '@tourkit/react'

export function TourTooltip() {
  const { currentStep, isActive, next, prev, stop, progress } = useTour()
  if (!isActive || !currentStep) return null
  return (
    <div role="dialog" aria-label={currentStep.title}>
      <h3>{currentStep.title}</h3>
      <p>{currentStep.content}</p>
      <button onClick={prev}>Back</button>
      <button onClick={next}>{progress.isLast ? 'Done' : 'Next'}</button>
    </div>
  )
}
```

## Multi-page tours

Use the `useNextAppRouter()` adapter for tours spanning multiple routes. Add a `route` property to each step. The adapter wraps `next/navigation` hooks.

Full article: [usertourkit.com/blog/nextjs-app-router-product-tour](https://usertourkit.com/blog/nextjs-app-router-product-tour)
