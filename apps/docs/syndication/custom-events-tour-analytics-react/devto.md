---
title: "Typed custom events for product tour analytics in React"
published: false
description: "Tour Kit ships 18 built-in analytics events. Here's how to add your own — typed CTA clicks, video completions, and form submissions — using the same plugin pipeline. Zero bundle cost."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/custom-events-tour-analytics-react
cover_image: https://usertourkit.com/og-images/custom-events-tour-analytics-react.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/custom-events-tour-analytics-react)*

# Setting up custom events for tour analytics in React

Tour Kit ships 18 built-in event types: `tour_started`, `step_viewed`, `hint_clicked`, and 15 others. They cover the tour lifecycle. But they can't tell you whether a user clicked the upgrade CTA on step 3, watched the embedded video to completion, or submitted the in-tour form that was the whole point of the onboarding flow.

Custom events fill that gap. Tour Kit's `metadata` field and plugin architecture let you track anything that happens during a tour step, using the same pipeline that handles lifecycle events. No separate analytics calls scattered across your components. One pipeline, typed end-to-end, with zero additional bundle cost.

By the end of this tutorial, you'll have a typed custom event system that tracks business-specific interactions during product tours and routes them to any analytics backend. We tested this pattern across PostHog, Mixpanel, and GA4. The same plugin interface handles all three without modification.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What you'll build

Tour Kit's `@tourkit/analytics` package (2 KB gzipped) provides three pieces: a `TourAnalytics` tracker that emits structured events, an `AnalyticsPlugin` interface that routes those events to backends, and an `AnalyticsProvider` that wires them together in React context. This tutorial extends each piece with typed custom events that capture what users actually do inside tour steps, not just whether they clicked "Next."

You'll build four things:

1. A typed event metadata schema for your app's custom interactions
2. Custom event helper functions that wrap `track()` with type safety
3. A custom analytics plugin that batches and transforms tour events for your backend
4. Step components that fire custom events through the `useAnalytics` hook

The total addition to your bundle is zero bytes. These are TypeScript types and thin wrapper functions over Tour Kit's existing `track()` method.

## Step 1: understand Tour Kit's event structure

Tour Kit's `TourEvent` type includes a `metadata` field typed as `Record<string, unknown>` that accepts arbitrary key-value data on every event. All 18 built-in event types carry this field, but `step_interaction` exists specifically for tracking user actions within a step that go beyond navigation. Expedia Group's engineering team described the core challenge well: "Common components know when an event occurs (such as a mouse click), but they do not know all the details necessary to satisfy required and optional fields" ([Expedia Group, Medium](https://medium.com/expedia-group-tech/contextual-and-consistent-analytic-event-triggering-in-react-40b48b15739e)). Tour Kit's provider architecture solves this by injecting tour-level context (tour ID, step index, session ID) automatically.

```tsx
// src/types/analytics.ts
import type { TourEvent, TourEventName } from '@tourkit/analytics'

// Tour Kit's built-in event names include:
// 'tour_started' | 'tour_completed' | 'tour_skipped' | 'tour_abandoned'
// 'step_viewed' | 'step_completed' | 'step_skipped' | 'step_interaction'
// 'hint_shown' | 'hint_dismissed' | 'hint_clicked'
// 'feature_used' | 'feature_adopted' | 'nudge_shown' | 'nudge_clicked'

// The metadata field is your escape hatch for custom data:
type EventMetadata = TourEvent['metadata']
// => Record<string, unknown> | undefined
```

That `interactionType` string is untyped by default. Anyone can pass `"clk"` or `"CTA_CLICK"` or `"cta-click"` and the compiler won't complain.

## Step 2: define typed custom event metadata

Raw `Record<string, unknown>` loses type safety fast. A discriminated union on your custom interaction types catches type errors at compile time instead of in your PostHog dashboard three weeks later.

```tsx
// src/types/tour-events.ts

/** Interaction types your app tracks during tour steps */
export type CustomInteractionType =
  | 'cta_click'
  | 'video_play'
  | 'video_complete'
  | 'form_submit'
  | 'link_click'
  | 'toggle_expand'
  | 'feature_preview'

/** Metadata schemas per interaction type */
export interface CtaClickMeta {
  interactionType: 'cta_click'
  ctaId: string
  ctaLabel: string
  destination?: string
}

export interface VideoMeta {
  interactionType: 'video_play' | 'video_complete'
  videoId: string
  videoDuration: number
  watchedPercent?: number
}

export interface FormSubmitMeta {
  interactionType: 'form_submit'
  formId: string
  fieldCount: number
  success: boolean
}

export interface LinkClickMeta {
  interactionType: 'link_click'
  href: string
  label: string
  external: boolean
}

/** Union of all custom metadata types */
export type CustomEventMeta =
  | CtaClickMeta
  | VideoMeta
  | FormSubmitMeta
  | LinkClickMeta
```

Pass `{ interactionType: 'cta_click' }` without a `ctaId` and TypeScript catches it before the event fires. Seven interaction types cover most SaaS onboarding flows we've seen.

## Step 3: create typed event helper functions

These helpers wrap Tour Kit's `stepInteraction()` method with your metadata schemas enforced at the call site. Each one is 4-8 lines of TypeScript with no runtime cost beyond the function call overhead (under 0.01ms per invocation).

```tsx
// src/lib/tour-analytics-helpers.ts
import type { TourAnalytics } from '@tourkit/analytics'
import type {
  CtaClickMeta,
  VideoMeta,
  FormSubmitMeta,
  LinkClickMeta,
} from '../types/tour-events'

/** Track a CTA click during a tour step */
export function trackCtaClick(
  analytics: TourAnalytics,
  tourId: string,
  stepId: string,
  meta: Omit<CtaClickMeta, 'interactionType'>
) {
  analytics.stepInteraction(tourId, stepId, 'cta_click', {
    interactionType: 'cta_click',
    ...meta,
  })
}

/** Track video playback during a tour step */
export function trackVideoEvent(
  analytics: TourAnalytics,
  tourId: string,
  stepId: string,
  meta: Omit<VideoMeta, 'interactionType'> & {
    interactionType: 'video_play' | 'video_complete'
  }
) {
  analytics.stepInteraction(tourId, stepId, meta.interactionType, meta)
}

/** Track form submission during a tour step */
export function trackFormSubmit(
  analytics: TourAnalytics,
  tourId: string,
  stepId: string,
  meta: Omit<FormSubmitMeta, 'interactionType'>
) {
  analytics.stepInteraction(tourId, stepId, 'form_submit', {
    interactionType: 'form_submit',
    ...meta,
  })
}

/** Track link click during a tour step */
export function trackLinkClick(
  analytics: TourAnalytics,
  tourId: string,
  stepId: string,
  meta: Omit<LinkClickMeta, 'interactionType'>
) {
  analytics.stepInteraction(tourId, stepId, 'link_click', {
    interactionType: 'link_click',
    ...meta,
  })
}
```

Each helper calls `analytics.stepInteraction()`, a built-in method on `TourAnalytics` that sets the event name to `step_interaction` and merges your metadata with the `interactionType` string.

## Step 4: build a custom analytics plugin

Tour Kit's `AnalyticsPlugin` interface has 5 methods: `init`, `track`, `identify`, `flush`, and `destroy`. Only `track` is required, the other 4 are optional. The plugin below transforms tour events into your backend's expected format, queues them in memory, and flushes in batches of 10 to reduce network overhead.

```tsx
// src/lib/custom-analytics-plugin.ts
import type { AnalyticsPlugin, TourEvent } from '@tourkit/analytics'

interface CustomBackendOptions {
  endpoint: string
  apiKey: string
  prefix?: string
}

export function customBackendPlugin(
  options: CustomBackendOptions
): AnalyticsPlugin {
  const queue: Record<string, unknown>[] = []
  const prefix = options.prefix ?? 'tour_'

  return {
    name: 'custom-backend',

    track(event: TourEvent) {
      const payload = {
        event: `${prefix}${event.eventName}`,
        properties: {
          tour_id: event.tourId,
          step_id: event.stepId,
          step_index: event.stepIndex,
          total_steps: event.totalSteps,
          duration_ms: event.duration,
          session_id: event.sessionId,
          timestamp: new Date(event.timestamp).toISOString(),
          ...event.metadata,
        },
      }

      queue.push(payload)

      if (queue.length >= 10) {
        this.flush?.()
      }
    },

    async flush() {
      if (queue.length === 0) return
      const batch = queue.splice(0, queue.length)

      try {
        await fetch(options.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.apiKey}`,
          },
          body: JSON.stringify({ events: batch }),
        })
      } catch {
        queue.unshift(...batch)
      }
    },

    destroy() {
      if (queue.length > 0) {
        const batch = queue.splice(0, queue.length)
        navigator.sendBeacon?.(
          options.endpoint,
          JSON.stringify({ events: batch })
        )
      }
    },
  }
}
```

The plugin uses `navigator.sendBeacon` in `destroy()`. Regular `fetch` calls get cancelled during page unload, but `sendBeacon` requests survive because the browser guarantees delivery up to 64 KB per call ([W3C Beacon spec](https://www.w3.org/TR/beacon/)).

## Step 5: wire it all together in React

Connect the provider, plugins, and custom event helpers in your app's root layout.

```tsx
// src/providers/analytics-provider.tsx
import { AnalyticsProvider } from '@tourkit/analytics'
import { posthogPlugin } from '@tourkit/analytics'
import { consolePlugin } from '@tourkit/analytics'
import { customBackendPlugin } from '../lib/custom-analytics-plugin'

export function TourAnalyticsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AnalyticsProvider
      config={{
        plugins: [
          ...(process.env.NODE_ENV === 'development'
            ? [consolePlugin()]
            : []),
          posthogPlugin({
            apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
          }),
          customBackendPlugin({
            endpoint: '/api/analytics/tour-events',
            apiKey: process.env.NEXT_PUBLIC_ANALYTICS_KEY!,
          }),
        ],
        debug: process.env.NODE_ENV === 'development',
        userId: undefined,
      }}
    >
      {children}
    </AnalyticsProvider>
  )
}
```

## Step 6: fire custom events from tour step components

Use the `useAnalytics` hook inside your tour step content to track custom interactions.

```tsx
// src/components/tour-steps/PricingStep.tsx
import { useAnalytics } from '@tourkit/analytics'
import { trackCtaClick, trackLinkClick } from '../../lib/tour-analytics-helpers'

interface PricingStepProps {
  tourId: string
  stepId: string
}

export function PricingStep({ tourId, stepId }: PricingStepProps) {
  const analytics = useAnalytics()

  const handleUpgradeClick = () => {
    trackCtaClick(analytics, tourId, stepId, {
      ctaId: 'pricing-upgrade',
      ctaLabel: 'Start free trial',
      destination: '/billing/upgrade',
    })
  }

  return (
    <div>
      <p>Your trial includes all Pro features for 14 days.</p>
      <button onClick={handleUpgradeClick}>Start free trial</button>
    </div>
  )
}
```

Each click fires a `step_interaction` event with your typed metadata. In PostHog, that shows up as `tourkit_step_interaction` with properties like `interactionType: "cta_click"` and `ctaId: "pricing-upgrade"`.

---

Full article with comparison table and troubleshooting guide: [usertourkit.com/blog/custom-events-tour-analytics-react](https://usertourkit.com/blog/custom-events-tour-analytics-react)
