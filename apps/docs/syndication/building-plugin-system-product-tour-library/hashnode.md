---
title: "Building a plugin system for a product tour library"
slug: "building-plugin-system-product-tour-library"
canonical: https://usertourkit.com/blog/building-plugin-system-product-tour-library
tags: react, typescript, javascript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/building-plugin-system-product-tour-library)*

# Building a plugin system for a product tour library

Product tour libraries have a plugin problem. React Joyride bakes analytics callbacks into its core props. Shepherd.js hard-codes event emitters that couple your tracking code to their internal API. Driver.js doesn't have a plugin system at all. You hook into lifecycle callbacks and wire everything yourself.

When I built Tour Kit's analytics package, the goal was a plugin interface that a developer could implement in under 30 lines of TypeScript, that tree-shakes to zero when unused, and that handles the messy realities of production analytics (batching, offline queuing, SDK initialization races, and cleanup).

I built Tour Kit as a solo developer. Everything is real code from `@tour-kit/analytics`.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## The plugin interface: 5 methods, 1 required

```ts
interface AnalyticsPlugin {
  name: string
  init?: () => void | Promise<void>
  track: (event: TourEvent) => void | Promise<void>
  identify?: (userId: string, properties?: Record<string, unknown>) => void
  flush?: () => void | Promise<void>
  destroy?: () => void
}
```

Only `name` and `track` are required. A console debug plugin needs just `track`. A PostHog plugin needs all 5. The interface accommodates both.

## 17 typed event types across 4 domains

```ts
type TourEventName =
  | 'tour_started' | 'tour_completed' | 'tour_skipped' | 'tour_abandoned'
  | 'step_viewed' | 'step_completed' | 'step_skipped' | 'step_interaction'
  | 'hint_shown' | 'hint_dismissed' | 'hint_clicked'
  | 'feature_used' | 'feature_adopted' | 'feature_churned'
  | 'nudge_shown' | 'nudge_clicked' | 'nudge_dismissed'
```

TypeScript catches `'tour_compelted'` at compile time. Shepherd's string-based `.on('complete')` catches it at runtime (or never).

## Event batching with critical event bypass

A 10-step tour generates ~22 events. Tour Kit batches them (default: 10 events or 5s interval) and flushes critical events (`tour_completed`, `tour_abandoned`, `tour_skipped`) immediately to prevent data loss on page unload.

The gotcha: an early version dispatched the critical event first, then flushed the queue. Dashboards showed tours "completing" before the last step was viewed.

## Custom plugin in 25 lines

```ts
import type { AnalyticsPlugin, TourEvent } from '@tour-kit/analytics'

export function customApiPlugin(options: { endpoint: string; apiKey: string }): AnalyticsPlugin {
  return {
    name: 'custom-api',
    track(event: TourEvent) {
      navigator.sendBeacon(
        options.endpoint,
        JSON.stringify({
          event: event.eventName,
          tourId: event.tourId,
          duration: event.duration,
          timestamp: event.timestamp,
          apiKey: options.apiKey,
        })
      )
    },
  }
}
```

Uses `sendBeacon` because it survives page unloads. `fetch` gets cancelled.

## Per-plugin error isolation

Every `plugin.track()` is wrapped in try/catch. A broken plugin never crashes the tour. We tested by deliberately throwing in a custom plugin. PostHog next in the chain still received every event.

## Bundle: 2.3KB for a PostHog-only setup

The tracker adds ~2KB gzipped. Each plugin adds 0.3-0.8KB. Dynamic `import()` means vendor SDKs load at runtime only. Compare: React Joyride ships 37KB regardless of which features you use.

---

Full article with comparison table, PostHog internals, lifecycle management, and 4 common mistakes to avoid: [usertourkit.com/blog/building-plugin-system-product-tour-library](https://usertourkit.com/blog/building-plugin-system-product-tour-library)
