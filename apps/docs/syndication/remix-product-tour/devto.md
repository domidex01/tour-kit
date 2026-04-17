---
title: "How to add a product tour to a Remix app (with nested routes and server persistence)"
published: false
description: "Most tour libraries assume Next.js or CRA. Here's how to build a multi-step product tour in Remix that persists across route changes and saves completion state through actions."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/remix-product-tour
cover_image: https://usertourkit.com/og-images/remix-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/remix-product-tour)*

# Product tours in Remix: setup, routing, and best practices

Remix apps handle data through loaders and actions at the route level, which means product tour libraries that assume component-level state don't fit cleanly. Most React tour tutorials target Next.js or plain Create React App setups and skip Remix-specific patterns like nested route persistence, loader-driven tour config, and focus management across route transitions. userTourKit is a headless React product tour library (core under 8KB gzipped) that works with Remix's architecture instead of against it. By the end of this tutorial you'll have a working multi-step tour that persists across nested route changes and stores completion state through Remix actions.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A five-step product tour inside a Remix app with a sidebar layout. The tour highlights navigation items, a search bar, a dashboard chart, and a settings panel across two nested routes. Tour state doesn't reset when the URL changes. Completion gets persisted server-side through a Remix action, so progress survives browser refreshes and syncs across devices.

We built and tested this in a Remix 2.15 + React 19 + TypeScript 5.7 project running on Vite. The same patterns apply to React Router v7 in framework mode, since Remix merged into React Router v7 as of December 2024. If you're on React Router v7 already, the only change is your import paths.

## Prerequisites

- Remix 2.x or React Router v7 in framework mode
- React 18.2+ (React 19 recommended)
- TypeScript 5.0+
- A Remix project with at least two routes and a shared layout

## Step 1: install userTourKit

userTourKit ships two packages. `@tourkit/core` has the framework-agnostic logic: step state machine, position engine, spotlight calculations. `@tourkit/react` adds hooks and components on top. Install both.

```bash
npm install @tourkit/core @tourkit/react
```

With pnpm:

```bash
pnpm add @tourkit/core @tourkit/react
```

Both packages output ESM and CJS. Remix's Vite bundler resolves them automatically. No special config needed.

## Step 2: add the tour provider to your root layout

Remix uses nested layouts. The root route (`app/root.tsx`) wraps every page, making it the right place for a tour provider that needs to survive route changes. Unlike Next.js, there's no `'use client'` boundary to worry about. Every Remix component is a client component by default after hydration.

```tsx
// app/root.tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'
import { TourProvider } from '@tourkit/react'

const tourSteps = [
  {
    id: 'sidebar-nav',
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Use the sidebar to move between dashboard sections.',
  },
  {
    id: 'search-bar',
    target: '[data-tour="search"]',
    title: 'Search',
    content: 'Find any report, user, or setting from here.',
  },
  {
    id: 'dashboard-chart',
    target: '[data-tour="chart"]',
    title: 'Analytics overview',
    content: 'Your key metrics update in real time.',
    route: '/dashboard',
  },
  {
    id: 'recent-activity',
    target: '[data-tour="activity"]',
    title: 'Recent activity',
    content: 'See what changed since your last visit.',
    route: '/dashboard',
  },
  {
    id: 'settings-panel',
    target: '[data-tour="settings"]',
    title: 'Settings',
    content: 'Configure notifications, integrations, and team access.',
    route: '/settings',
  },
]

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <TourProvider tourId="onboarding" steps={tourSteps} persist="localStorage">
          <Outlet />
        </TourProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
```

The `persist="localStorage"` flag means tour progress survives page refreshes on the same browser. We'll add server-side persistence in step 4.

Placing `TourProvider` above `<Outlet />` is what makes this work across nested routes. When a user navigates from `/dashboard` to `/settings`, the `Outlet` swaps but the provider stays mounted. Tour state doesn't reset.

## Step 3: render tour UI in your layout

userTourKit is headless, so you bring your own tooltip component. Create a tour tooltip using whatever styling your project already uses. This example uses Tailwind.

```tsx
// app/components/tour-tooltip.tsx
import { useTour, useTourStep } from '@tourkit/react'

export function TourTooltip() {
  const { isActive, currentStep, totalSteps, next, prev, stop } = useTour()
  const step = useTourStep()

  if (!isActive || !step) return null

  return (
    <div
      role="dialog"
      aria-label={step.title}
      className="fixed z-50 max-w-xs rounded-lg border bg-white p-4 shadow-lg"
    >
      <p className="text-sm font-medium">{step.title}</p>
      <p className="mt-1 text-sm text-gray-600">{step.content}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {currentStep + 1} of {totalSteps}
        </span>
        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={prev}
              className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Back
            </button>
          )}
          {currentStep < totalSteps - 1 ? (
            <button
              onClick={next}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={stop}
              className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

Then add the tooltip and a trigger button to your layout:

```tsx
// app/routes/_layout.tsx
import { Outlet } from '@remix-run/react'
import { useTour, TourSpotlight } from '@tourkit/react'
import { TourTooltip } from '~/components/tour-tooltip'

export default function Layout() {
  const { start } = useTour()

  return (
    <div className="flex min-h-screen">
      <aside data-tour="sidebar" className="w-64 border-r bg-gray-50 p-4">
        {/* sidebar nav items */}
      </aside>
      <main className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <input
            data-tour="search"
            type="search"
            placeholder="Search..."
            className="rounded border px-3 py-2"
          />
          <button
            onClick={() => start()}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Start tour
          </button>
        </div>
        <Outlet />
      </main>
      <TourSpotlight />
      <TourTooltip />
    </div>
  )
}
```

The `data-tour` attributes on target elements are how userTourKit finds them. No refs to thread, no IDs to keep in sync. Add the attribute, point the step config at the selector, done.

## Step 4: persist tour completion with a Remix action

localStorage works for single-device persistence, but production apps usually want server-side state. Remix actions handle this naturally. Create a resource route that saves tour completion.

```tsx
// app/routes/api.tour-complete.tsx
import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const tourId = formData.get('tourId')
  const userId = formData.get('userId')

  if (typeof tourId !== 'string' || typeof userId !== 'string') {
    return json({ error: 'Missing fields' }, { status: 400 })
  }

  // Replace with your actual database call
  await db.tourCompletion.upsert({
    where: { userId_tourId: { userId, tourId } },
    create: { userId, tourId, completedAt: new Date() },
    update: { completedAt: new Date() },
  })

  return json({ success: true })
}
```

Then fire the action when the tour finishes using `useFetcher`:

```tsx
// app/components/tour-tooltip.tsx (updated Done button)
import { useFetcher } from '@remix-run/react'

// Inside TourTooltip:
const fetcher = useFetcher()

// Replace the Done button:
<button
  onClick={() => {
    stop()
    fetcher.submit(
      { tourId: 'onboarding', userId: currentUser.id },
      { method: 'post', action: '/api/tour-complete' }
    )
  }}
  className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
>
  Done
</button>
```

`useFetcher` submits without a full-page navigation. The user sees the tour end instantly while Remix fires the POST in the background. And because this is a resource route (no default export), it won't interfere with your page layout.

## Step 5: handle route-aware steps with navigation

Some tour steps point to elements on different routes. When the user clicks "Next" and the target lives at `/settings`, the tour needs to navigate there first, wait for the element to render, then highlight it.

userTourKit handles this through the `route` field on step configs. But you need to tell it how to navigate. Pass your Remix navigation function to the provider.

```tsx
// app/root.tsx (updated)
import { useNavigate } from '@remix-run/react'

export default function App() {
  const navigate = useNavigate()

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <TourProvider
          tourId="onboarding"
          steps={tourSteps}
          persist="localStorage"
          onNavigate={(route) => navigate(route)}
        >
          <Outlet />
        </TourProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
```

When the tour reaches a step with a `route` value that doesn't match the current URL, userTourKit calls `onNavigate`, waits for the target element to appear in the DOM (with a configurable timeout), then positions the tooltip. If the element doesn't appear within 5 seconds, the step gets skipped and the tour moves forward.

The gotcha we hit: `useNavigate` must be called inside the Router context. In Remix, `root.tsx` is already inside the router, so this works. If you're extracting the provider into a separate file, make sure it stays inside the router boundary.

## Step 6: manage focus across route transitions

Remix doesn't manage focus when routes change. The framework's own accessibility guide calls this out: "What element receives focus when the route changes? This is important for keyboard users." When your tour navigates between routes, keyboard users can lose their place.

userTourKit moves focus to the active tooltip after each step transition, which covers the tour itself. But between the navigation and the tooltip appearing, there's a brief gap. Handle it by resetting focus to a known landmark.

```tsx
// app/root.tsx
import { useLocation } from '@remix-run/react'
import { useEffect, useRef } from 'react'

function FocusManager({ children }) {
  const location = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    // After route change, move focus to main content
    // userTourKit will override this if a tour is active
    mainRef.current?.focus()
  }, [location.pathname])

  return (
    <main ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
      {children}
    </main>
  )
}
```

This pattern comes from Marcy Sutton's client-side routing accessibility research, which the Remix docs reference directly. userTourKit's built-in focus trap takes over once the tooltip renders, so there's no conflict between the two focus management strategies.

## Common issues and troubleshooting

### "Tour tooltip doesn't appear after navigation"

This happens when the target element isn't in the DOM yet. Remix streams route data through loaders, and the component might not mount until the loader resolves. Check two things: first, that your loader isn't slow (the default wait timeout is 5 seconds). Second, that the `data-tour` attribute is on an element that renders immediately, not inside a Suspense boundary or lazy-loaded chunk.

### "Tour state resets when I navigate"

The `TourProvider` must be above the `Outlet` that changes. If your provider is inside a nested route rather than the root layout, navigating away from that route unmounts the provider and kills the state. Move it up to the nearest layout that wraps all tour-relevant routes.

### "Spotlight overlay covers the whole page on first render"

This is a hydration timing issue. Remix server-renders the page, then hydrates on the client. If the tour auto-starts before hydration finishes, the target element positions are wrong. Delay auto-start by 100ms or use `requestIdleCallback`:

```tsx
const { start } = useTour()

useEffect(() => {
  const id = requestIdleCallback(() => start())
  return () => cancelIdleCallback(id)
}, [start])
```

### "Tour breaks after upgrading to React Router v7"

If you migrated from Remix to React Router v7, update your imports from `@remix-run/react` to `react-router`. The tour library imports don't change. Remix published a codemod that handles the migration automatically: `npx codemod remix/2/react-router/upgrade`.

## What about React Router v7 and Remix 3?

As of April 2026, what was planned as Remix v3 shipped as React Router v7. The patterns in this tutorial work identically in both, since React Router v7 framework mode is Remix. Just swap `@remix-run/*` imports for `react-router`.

Separately, a Remix 3 project exists that replaces React with a Preact fork and takes an HTML-over-the-wire approach. That version won't run React tour libraries at all. If you're evaluating Remix 3, you'll need a different approach to onboarding UX.

React Router is used by 7.8 million GitHub projects, and Shopify runs a 5-million-line application on it. The framework isn't going anywhere.

| Feature | Remix 2 / React Router v7 | Remix 3 (Preact fork) |
|---|---|---|
| React tour library support | Full support | None (no React) |
| Loaders and actions | Yes, route-bound | Yes, similar model |
| Nested routing | Yes | Yes |
| Market share (2026) | ~18% | Pre-release |
| Migration path | Codemod available | Full rewrite required |

## Honest limitations

userTourKit requires React developers who are comfortable writing JSX for tooltip UI. There's no visual tour builder or drag-and-drop editor. If your team doesn't have React experience, a no-code tool like Appcues or Userflow might be a better fit. The project is also younger and has a smaller community than React Joyride (5.1K GitHub stars, 340K+ weekly downloads as of April 2026). And there's no React Native or mobile SDK, so this is web only.

## Next steps

You now have a working product tour in Remix with nested route support, server-side persistence, and accessible focus management. A few things to try from here:

- Add conditional tours based on user role using a loader that checks permissions
- Track tour analytics with `@tourkit/analytics`
- Build an onboarding checklist that includes the tour as one task using `@tourkit/checklists`
- Add Framer Motion animations to the tooltip transitions

## FAQ

### Does userTourKit work with Remix 2 and React Router v7?

Yes. userTourKit is a React library that doesn't depend on any specific framework. It works in Remix 2, React Router v7 framework mode, and React Router v7 library mode. The only framework-specific code is the `onNavigate` callback where you pass your router's navigation function.

### How do I persist tour progress across devices in Remix?

Use a Remix resource route with an action that writes completion state to your database. Call it with `useFetcher().submit()` when the tour finishes. Load the state in your root loader and pass it to the `TourProvider` as the `initialCompleted` prop. This gives you server-authoritative state that syncs across browsers.

### Can I load tour step configuration from a Remix loader?

Yes. Define your steps array in a loader and pass it to the component through `useLoaderData()`. This lets you A/B test different step sequences, localize tour content per user language, or gate steps behind feature flags — all resolved server-side before the page renders.

### Does adding a product tour affect Remix performance?

userTourKit's core is under 8KB gzipped, and the React package adds another 4KB. The spotlight overlay uses CSS transforms, not JavaScript-driven animations, so there's no layout thrashing. Remix's server-first rendering means the tour JavaScript only loads on the client during hydration, keeping your initial server response lean.

### How is userTourKit different from using React Joyride in Remix?

React Joyride works in Remix, but it ships at 37KB gzipped with its own UI that you can't easily customize. It doesn't have route-aware steps, so multi-page tours require manual navigation handling. userTourKit is headless (you control the UI), lighter (under 12KB total), and has built-in route navigation support through the `onNavigate` callback.

---

*Sources: Remix + React Router merge announcement, Remix accessibility guide, CodiLime Remix best practices, LogRocket: Remix 3 ditched React, Smashing Magazine: Product tours in React. Data points date-stamped April 2026.*
