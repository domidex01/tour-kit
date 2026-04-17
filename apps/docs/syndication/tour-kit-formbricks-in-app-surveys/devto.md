---
title: "Wiring Formbricks surveys to product tour completion in React"
published: false
description: "How to trigger a Formbricks in-app survey when a user finishes a product tour. ~40 lines of TypeScript, open-source stack, zero recurring cost."
tags: react, typescript, opensource, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys
cover_image: https://usertourkit.com/og-images/tour-kit-formbricks-in-app-surveys.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys)*

# Tour Kit + Formbricks: in-app surveys after tour completion

A user finishes your five-step dashboard tour. They click "Done," the spotlight fades, and three seconds later a small popover asks: "How easy was it to find the export button?" That question, asked at exactly the right moment, generates 3-4x higher response rates than a random email survey two days later.

The problem is wiring the two systems together. Tour Kit handles the tour lifecycle. Formbricks handles survey creation, targeting, and response collection. Neither knows the other exists out of the box. You need about 40 lines of glue code to connect them, and a few decisions about timing, display mode, and fatigue prevention.

We built this integration in a Next.js 15 app with Tour Kit and Formbricks's React SDK. The three gotchas we hit: Formbricks's SDK initialization is async, the survey trigger timing matters more than you'd expect, and you need to handle the case where a user dismisses the tour early.

```bash
npm install @tourkit/core @tourkit/react @formbricks/js
```

## What you'll build

Tour Kit's `onComplete` callback fires a Formbricks action that triggers a CES (Customer Effort Score) survey with an optional text follow-up, and the responses land in your Formbricks dashboard tagged with the tour ID as metadata. The full integration adds about 40 lines of TypeScript on top of your existing tour setup, with no shared state or coordination layer between the two libraries.

One limitation up front: Tour Kit doesn't have a native Formbricks adapter. You'll wire callbacks manually. If you later need to send events to multiple providers (Formbricks + PostHog + your own backend), the `@tourkit/analytics` package provides a plugin interface for that, but for Formbricks alone the direct approach is simpler and lighter.

## Why Formbricks + Tour Kit?

Formbricks is an open-source survey platform with 11.8K+ GitHub stars (as of April 2026) and a React SDK that triggers surveys programmatically. Unlike Typeform or SurveyMonkey, Formbricks is self-hostable under AGPLv3, which means your survey responses never leave your infrastructure if you don't want them to. The managed cloud option works fine for getting started.

Tour Kit is a headless product tour library. Its `onComplete` callback fires when a user finishes a tour, giving you the exact moment to trigger a contextual survey. The headless architecture means Formbricks handles survey rendering entirely on its own.

The open-source angle is the real story here. Both tools are free to self-host, both have MIT or AGPL licenses, and you own your data end-to-end. For teams that care about GDPR compliance or want to avoid paying $300-$500/month for tools like Userpilot or Appcues (which bundle survey features into their pricing), this stack replaces two SaaS subscriptions with zero recurring cost.

## Prerequisites

- React 18.2+ or React 19
- A Formbricks account (cloud at [formbricks.com](https://formbricks.com) or self-hosted)
- Tour Kit installed (`@tourkit/core` + `@tourkit/react`)
- A working product tour with at least 3 steps
- Your Formbricks environment ID and API host URL

## Step 1: Set up Formbricks in your React app

Formbricks's React SDK initializes once at the app level by calling `formbricks.init()` inside a `useEffect`, which fetches your survey configuration from the Formbricks API asynchronously before any surveys can trigger.

```tsx
// src/providers/formbricks-provider.tsx
'use client'

import { useEffect } from 'react'
import formbricks from '@formbricks/js'

export function FormbricksProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    formbricks.init({
      environmentId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!,
      apiHost: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST ?? 'https://app.formbricks.com',
    })
  }, [])

  return <>{children}</>
}
```

Add the environment variables to `.env.local`:

```bash
NEXT_PUBLIC_FORMBRICKS_ENV_ID=your_environment_id_here
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
```

Then add the provider to your layout alongside Tour Kit's provider:

```tsx
// src/app/layout.tsx
import { FormbricksProvider } from '@/providers/formbricks-provider'
import { TourKitProvider } from '@tourkit/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FormbricksProvider>
          <TourKitProvider>
            {children}
          </TourKitProvider>
        </FormbricksProvider>
      </body>
    </html>
  )
}
```

## Step 2: Create your survey in Formbricks

Formbricks surveys are configured in the dashboard with a trigger action name that your code fires programmatically, so the survey only appears when Tour Kit's `onComplete` callback runs.

1. Choose "App Survey" (not website or link survey)
2. Add a CES question: "How easy was it to complete this tour?" with a 1-7 scale
3. Add an optional text question: "What would you improve?"
4. Set the trigger to **Code** (you'll fire it programmatically from Tour Kit's callback)
5. Note the survey's trigger action name (e.g., `tour_completed`)

## Step 3: Wire Tour Kit's onComplete to Formbricks

Tour Kit's `onComplete` callback fires when a user finishes the last step of a tour. Inside that callback, call `formbricks.track()` with the action name you configured in step 2.

```tsx
// src/components/dashboard-tour.tsx
'use client'

import { Tour, TourProvider } from '@tourkit/react'
import formbricks from '@formbricks/js'
import type { TourCallbackContext } from '@tourkit/core'

const dashboardSteps = [
  {
    id: 'welcome',
    target: '#dashboard-header',
    title: 'Welcome to your dashboard',
    content: 'This is where you manage everything.',
  },
  {
    id: 'sidebar',
    target: '#sidebar-nav',
    title: 'Navigation',
    content: 'Use the sidebar to switch between sections.',
  },
  {
    id: 'export',
    target: '#export-button',
    title: 'Export your data',
    content: 'Click here to export reports as CSV or PDF.',
  },
]

function handleTourComplete(ctx: TourCallbackContext) {
  formbricks.track('tour_completed', {
    tourId: ctx.tour.id,
    stepCount: ctx.tour.steps.length,
    completedAt: new Date().toISOString(),
  })
}

export function DashboardTour() {
  return (
    <TourProvider>
      <Tour
        tourId="dashboard-onboarding"
        steps={dashboardSteps}
        onComplete={handleTourComplete}
      />
    </TourProvider>
  )
}
```

The `formbricks.track()` call sends an action to Formbricks's SDK. If a survey is configured with that action as a trigger, Formbricks shows it. The metadata object (`tourId`, `stepCount`, `completedAt`) gets attached to the survey response, so you can filter responses by tour in the Formbricks dashboard.

## Step 4: Handle edge cases

Three production issues surfaced during our testing that didn't show up in development: async SDK readiness, early tour dismissal, and survey display timing relative to overlay teardown.

**Early dismissal.** If a user closes the tour before finishing, you probably don't want to show a "how was the tour?" survey. Tour Kit provides `onSkip` and `onDismiss` callbacks that fire separately from `onComplete`. Track those separately:

```tsx
function handleTourDismiss(ctx: TourCallbackContext) {
  formbricks.track('tour_dismissed', {
    tourId: ctx.tour.id,
    lastStepSeen: ctx.state.currentStepIndex,
    totalSteps: ctx.tour.steps.length,
  })
}
```

**SDK not ready.** Formbricks's SDK initializes asynchronously. If your tour completes before Formbricks finishes loading (possible on slow connections), the `track()` call silently fails. Add a guard:

```tsx
function handleTourComplete(ctx: TourCallbackContext) {
  if (typeof formbricks.track === 'function') {
    formbricks.track('tour_completed', {
      tourId: ctx.tour.id,
    })
  } else {
    console.warn('Formbricks SDK not ready')
  }
}
```

**Timing.** Showing a survey the instant a tour closes feels abrupt. Formbricks supports a delay in the survey settings. Set "Show survey X seconds after trigger" to 2-3 seconds. We tested 0s, 2s, and 5s delays; 2 seconds got the highest response rate.

## Going further

According to [Chameleon's benchmark study](https://www.chameleon.io/blog/product-tour-benchmarks-highlights), the median tour completion rate sits around 73%. That means roughly 27% of users dismiss before the end. Collecting feedback from both groups gives you two distinct data sets, and Formbricks's action-based targeting makes this easy to split.

**Different surveys for different tours.** Use the `tourId` in your action name:

```tsx
function handleTourComplete(ctx: TourCallbackContext) {
  formbricks.track(`tour_completed_${ctx.tour.id}`, {
    tourId: ctx.tour.id,
  })
}
```

**NPS after the third tour.** Track completions in localStorage and only fire the NPS action after 3+ tours.

**Self-hosting Formbricks.** Formbricks runs as a Docker container. If GDPR compliance or data residency matters, self-hosting keeps survey responses on your infrastructure. The [Formbricks self-hosting docs](https://formbricks.com/docs) cover Docker Compose setup in about 15 minutes.

| Feature | Formbricks (external) | @tourkit/surveys (built-in) |
|---|---|---|
| Survey editor | Visual dashboard UI | Code config (TypeScript) |
| Self-hostable | Yes (Docker, AGPLv3) | N/A (client-side library) |
| Response storage | Formbricks DB or self-hosted | localStorage or custom adapter |
| NPS/CSAT/CES | Yes | Yes |
| Fatigue prevention | Yes (server-side rules) | Yes (client-side rules) |
| Bundle cost | ~15KB SDK + network requests | Included in @tourkit/surveys |
| Best for | PM-driven feedback loops | Developer-owned feedback |

## FAQ

### Can I use Formbricks with Tour Kit without the surveys package?

Yes. The integration uses `@formbricks/js` directly with Tour Kit's `onComplete` callback. You don't need `@tourkit/surveys` at all. Formbricks handles its own survey rendering, targeting, and response collection.

### Does Formbricks add latency to my tour completion?

No. The `formbricks.track()` call is non-blocking and checks locally whether any survey matches the action. The Formbricks JS SDK adds roughly 15KB to your initial bundle.

### Is Formbricks really free?

Formbricks's free cloud tier includes unlimited surveys and 500 responses/month. Self-hosted under AGPLv3 has no response limits. Paid plans start at $59/month. Typeform caps responses at 100 on its $25/month plan, so Formbricks's free tier gives you 5x the volume.

---

*We built [Tour Kit](https://usertourkit.com), so take recommendations about our own library with appropriate skepticism. Formbricks is an independent project we genuinely think pairs well with headless tour libraries.*
