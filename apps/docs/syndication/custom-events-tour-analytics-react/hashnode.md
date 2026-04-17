---
title: "Setting up custom events for tour analytics in React"
slug: "custom-events-tour-analytics-react"
canonical: https://usertourkit.com/blog/custom-events-tour-analytics-react
tags: react, typescript, javascript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/custom-events-tour-analytics-react)*

# Setting up custom events for tour analytics in React

Tour Kit ships 18 built-in event types: `tour_started`, `step_viewed`, `hint_clicked`, and 15 others. They cover the tour lifecycle. But they can't tell you whether a user clicked the upgrade CTA on step 3, watched the embedded video to completion, or submitted the in-tour form that was the whole point of the onboarding flow.

Custom events fill that gap. Tour Kit's `metadata` field and plugin architecture let you track anything that happens during a tour step, using the same pipeline that handles lifecycle events. One pipeline, typed end-to-end, with zero additional bundle cost.

This tutorial walks through building a typed custom event system that tracks business-specific interactions during product tours and routes them to any analytics backend. We tested this across PostHog, Mixpanel, and GA4.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What you'll build

1. A typed event metadata schema for custom interactions
2. Helper functions that wrap `track()` with type safety
3. A custom analytics plugin with batching
4. Step components that fire custom events via `useAnalytics`

Zero additional bundle cost — TypeScript types and thin wrappers over Tour Kit's existing `track()`.

## The key insight: metadata + step_interaction

Tour Kit's `TourEvent` type includes a `metadata` field (`Record<string, unknown>`) on every event. The `step_interaction` event type exists specifically for tracking user actions within a step beyond navigation. Define a discriminated union for type safety:

```tsx
// src/types/tour-events.ts
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

export type CustomEventMeta = CtaClickMeta | VideoMeta | FormSubmitMeta
```

Then wrap with typed helpers:

```tsx
// src/lib/tour-analytics-helpers.ts
import type { TourAnalytics } from '@tourkit/analytics'
import type { CtaClickMeta } from '../types/tour-events'

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
```

## Custom plugin with batching and sendBeacon

```tsx
// src/lib/custom-analytics-plugin.ts
import type { AnalyticsPlugin, TourEvent } from '@tourkit/analytics'

export function customBackendPlugin(options: {
  endpoint: string
  apiKey: string
}): AnalyticsPlugin {
  const queue: Record<string, unknown>[] = []

  return {
    name: 'custom-backend',
    track(event: TourEvent) {
      queue.push({
        event: `tour_${event.eventName}`,
        properties: {
          tour_id: event.tourId,
          step_id: event.stepId,
          ...event.metadata,
        },
      })
      if (queue.length >= 10) this.flush?.()
    },
    async flush() {
      if (!queue.length) return
      const batch = queue.splice(0, queue.length)
      try {
        await fetch(options.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.apiKey}` },
          body: JSON.stringify({ events: batch }),
        })
      } catch { queue.unshift(...batch) }
    },
    destroy() {
      if (queue.length > 0) {
        navigator.sendBeacon?.(options.endpoint, JSON.stringify({ events: queue.splice(0) }))
      }
    },
  }
}
```

## Firing from step components

```tsx
import { useAnalytics } from '@tourkit/analytics'
import { trackCtaClick } from '../../lib/tour-analytics-helpers'

export function PricingStep({ tourId, stepId }: { tourId: string; stepId: string }) {
  const analytics = useAnalytics()

  return (
    <button onClick={() => trackCtaClick(analytics, tourId, stepId, {
      ctaId: 'pricing-upgrade',
      ctaLabel: 'Start free trial',
      destination: '/billing/upgrade',
    })}>
      Start free trial
    </button>
  )
}
```

---

Full article with comparison table, troubleshooting, and FAQ: [usertourkit.com/blog/custom-events-tour-analytics-react](https://usertourkit.com/blog/custom-events-tour-analytics-react)
