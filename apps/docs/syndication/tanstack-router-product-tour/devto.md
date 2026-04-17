---
title: "Type-safe multi-page product tours with TanStack Router + Tour Kit"
published: false
description: "Most tour libraries treat routing as an afterthought. Here's how to get compile-time route validation for your onboarding flows using TanStack Router's type system."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tanstack-router-product-tour
cover_image: https://usertourkit.com/og-images/tanstack-router-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tanstack-router-product-tour)*

# Tour Kit + TanStack Router: multi-page tours with type safety

Most product tour libraries treat routing as an afterthought. You define steps, each with a `route` string, and the library does a `window.location` push when it needs to change pages. There's no type checking on route paths, no validation that the route even exists, and zero access to route-level context like auth state or feature flags.

TanStack Router changes the equation. Its type-safe route tree means your tour step routes get validated at compile time. Its `beforeLoad` hooks let you gate tour progression on real conditions. And its route context system gives tour steps access to the same data your components use, without prop drilling.

This article walks through building a multi-page onboarding tour that uses TanStack Router's type system to catch broken routes before they reach production.

```bash
npm install @tourkit/core @tourkit/react @tanstack/react-router
```

[See the full Tour Kit docs at usertourkit.com](https://usertourkit.com/)

## What you'll build

By the end of this guide, you'll have a four-step onboarding tour that spans three routes (`/dashboard`, `/dashboard/settings`, and `/dashboard/projects/new`) with compile-time route validation and route-context-driven visibility. Each step targets a specific element on its page. When a user advances past a step on one route, Tour Kit navigates to the next route automatically.

## Why TanStack Router + Tour Kit?

TanStack Router hit 2.3 million weekly npm downloads as of April 2026, up from under 500K a year earlier, because developers want type safety everywhere, including their routing layer.

A typical tour config with React Router looks like this:

```tsx
// src/tours/onboarding.ts — no route validation
const steps = [
  { target: '#welcome-banner', route: '/dashbord' }, // typo — runtime 404
  { target: '#settings-btn', route: '/dashboard/setings' }, // another typo
]
```

Both routes have typos. You won't know until a user hits step 2 and lands on a 404. With TanStack Router, the route tree is a TypeScript type. Constrain step routes to that type, and `'/dashbord'` becomes a compile error instead of a production bug.

## Step 1: create the TanStack Router adapter

Tour Kit abstracts routing through a `RouterAdapter` interface with four methods: `getCurrentRoute()`, `navigate()`, `matchRoute()`, and `onRouteChange()`. Writing an adapter for TanStack Router takes about 40 lines.

```tsx
// src/adapters/tanstack-router.ts
import type { RouterAdapter } from '@tourkit/core'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

export function useTanStackRouter(): RouterAdapter {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const callbacksRef = useRef<Set<(route: string) => void>>(new Set())
  const pathnameRef = useRef(pathname)
  const previousPathRef = useRef(pathname)

  pathnameRef.current = pathname

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname
      for (const cb of callbacksRef.current) {
        cb(pathname)
      }
    }
  }, [pathname])

  const getCurrentRoute = useCallback(() => pathnameRef.current, [])

  const doNavigate = useCallback(
    (route: string): undefined => {
      navigate({ to: route })
      return undefined
    },
    [navigate],
  )

  const matchRoute = useCallback(
    (pattern: string, mode: 'exact' | 'startsWith' | 'contains' = 'exact') => {
      const current = pathnameRef.current
      switch (mode) {
        case 'exact':
          return current === pattern
        case 'startsWith':
          return current.startsWith(pattern)
        case 'contains':
          return current.includes(pattern)
        default:
          return current === pattern
      }
    },
    [],
  )

  const onRouteChange = useCallback((callback: (route: string) => void) => {
    callbacksRef.current.add(callback)
    callback(pathnameRef.current)
    return () => {
      callbacksRef.current.delete(callback)
    }
  }, [])

  return useMemo<RouterAdapter>(
    () => ({ getCurrentRoute, navigate: doNavigate, matchRoute, onRouteChange }),
    [getCurrentRoute, doNavigate, matchRoute, onRouteChange],
  )
}
```

## Step 2: wire up the provider

Place `MultiTourKitProvider` inside TanStack Router's root route:

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { MultiTourKitProvider } from '@tourkit/react'
import { useTanStackRouter } from '../adapters/tanstack-router'

interface RootContext {
  onboardingComplete: boolean
}

function RootComponent() {
  const router = useTanStackRouter()
  return (
    <MultiTourKitProvider router={router}>
      <Outlet />
    </MultiTourKitProvider>
  )
}

export const Route = createRootRouteWithContext<RootContext>()({
  component: RootComponent,
})
```

## Step 3: type-safe tour steps

Constrain routes against TanStack Router's generated route types:

```tsx
// src/tours/type-safe-routes.ts
import type { RegisteredRouter, RoutePaths } from '@tanstack/react-router'

type ValidRoute = RoutePaths<RegisteredRouter['routeTree']>

interface TypeSafeTourStep {
  id: string
  target: string
  title: string
  content: string
  route: ValidRoute // compile error if route doesn't exist
}
```

Now `route: '/dashbord'` is a compile error. That's the gotcha we hit during testing — without this constraint, a renamed route silently breaks your tour.

## Step 4: use beforeLoad to gate tour visibility

```tsx
// src/routes/dashboard.tsx
import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: ({ context }) => {
    return { shouldShowTour: !context.onboardingComplete }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { shouldShowTour } = Route.useRouteContext()
  return (
    <div>
      <div id="welcome-banner">Dashboard overview</div>
      {shouldShowTour && <OnboardingTour />}
    </div>
  )
}
```

The `context.onboardingComplete` value is fully typed from `RootContext`. No `as` casts needed.

## Going further

- **Search params for tour state:** Use Zod-validated search params (`?tourStep=2`) so tour progress survives refreshes
- **Code splitting:** Tour step content lazy-loads with TanStack Router's automatic code splitting
- **Analytics:** Fire `tour:step_viewed` events with the route path to see which page transitions cause drop-offs

Tour Kit's core ships at under 8KB gzipped. Combined with TanStack Router's ~12KB, total overhead stays under 20KB — lighter than React Joyride alone (37KB).

A limitation to know: Tour Kit requires React 18+ and has no visual builder. You're writing tour configs in TypeScript.

---

Full article with all code examples and FAQ: [usertourkit.com/blog/tanstack-router-product-tour](https://usertourkit.com/blog/tanstack-router-product-tour)
