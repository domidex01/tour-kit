---
title: "Product tours in Remix: setup, routing, and best practices"
slug: "remix-product-tour"
canonical: https://usertourkit.com/blog/remix-product-tour
tags: react, javascript, web-development, remix
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

```bash
npm install @tourkit/core @tourkit/react
```

Both packages output ESM and CJS. Remix's Vite bundler resolves them automatically.

## Step 2: add the tour provider to your root layout

The root route wraps every page, making it the right place for a tour provider that survives route changes.

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
    id: 'dashboard-chart',
    target: '[data-tour="chart"]',
    title: 'Analytics overview',
    content: 'Your key metrics update in real time.',
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
      <head><Meta /><Links /></head>
      <body>
        <TourProvider tourId="onboarding" steps={tourSteps} persist="localStorage">
          <Outlet />
        </TourProvider>
        <ScrollRestoration /><Scripts />
      </body>
    </html>
  )
}
```

Placing `TourProvider` above `<Outlet />` makes this work across nested routes. When a user navigates from `/dashboard` to `/settings`, the Outlet swaps but the provider stays mounted.

## Step 4: persist with a Remix action

```tsx
// app/routes/api.tour-complete.tsx
import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const tourId = formData.get('tourId')
  const userId = formData.get('userId')

  await db.tourCompletion.upsert({
    where: { userId_tourId: { userId, tourId } },
    create: { userId, tourId, completedAt: new Date() },
    update: { completedAt: new Date() },
  })

  return json({ success: true })
}
```

Fire it with `useFetcher().submit()` when the tour finishes. No full-page navigation needed.

## Full tutorial

The full article covers tooltip rendering, route-aware navigation, focus management across transitions, troubleshooting, and the React Router v7 migration path.

Read the complete version: [Product tours in Remix: setup, routing, and best practices](https://usertourkit.com/blog/remix-product-tour)

---

*Data points date-stamped April 2026.*
