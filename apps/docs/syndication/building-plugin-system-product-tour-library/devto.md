---
title: "How I built a plugin system for a React product tour library"
published: false
description: "Typed plugin interface, event batching with critical event bypass, per-plugin error isolation, and tree-shaking. Real TypeScript from Tour Kit's analytics package."
tags: react, typescript, javascript, webdev
canonical_url: https://usertourkit.com/blog/building-plugin-system-product-tour-library
cover_image: https://usertourkit.com/og-images/building-plugin-system-product-tour-library.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/building-plugin-system-product-tour-library)*

# Building a plugin system for a product tour library

Product tour libraries have a plugin problem. React Joyride bakes analytics callbacks into its core props. Shepherd.js hard-codes event emitters that couple your tracking code to their internal API. Driver.js doesn't have a plugin system at all. You hook into lifecycle callbacks and wire everything yourself. None of these approaches tree-shake well, and none let you swap analytics providers without rewriting integration code.

When I built Tour Kit's analytics package, the goal was a plugin interface that a developer could implement in under 30 lines of TypeScript, that tree-shakes to zero when unused, and that handles the messy realities of production analytics (batching, offline queuing, SDK initialization races, and cleanup).

I built Tour Kit as a solo developer. Everything here is real code, not a thought experiment.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## The plugin interface contract

Tour Kit's `AnalyticsPlugin` interface exposes 5 methods (only `track` is required) and a `name` identifier, totaling roughly 15 lines of TypeScript:

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

Only `name` and `track` are required. A console-logging debug plugin doesn't need `init`, `flush`, or `destroy`. A PostHog plugin needs all of them. The interface accommodates both without forcing empty method stubs.

## 17 typed event types

Tour Kit defines 17 event types across 4 domains using a TypeScript union type:

```ts
type TourEventName =
  | 'tour_started' | 'tour_completed' | 'tour_skipped' | 'tour_abandoned'
  | 'step_viewed' | 'step_completed' | 'step_skipped' | 'step_interaction'
  | 'hint_shown' | 'hint_dismissed' | 'hint_clicked'
  | 'feature_used' | 'feature_adopted' | 'feature_churned'
  | 'nudge_shown' | 'nudge_clicked' | 'nudge_dismissed'
```

The union type catches typos at compile time. Writing `'tour_compelted'` fails the type checker. With Shepherd's string-based `.on('complete')`, you find out at runtime.

## Event batching with critical event bypass

A 10-step tour generates ~22 events. Firing 22 network requests in sequence kills performance on mobile.

Tour Kit's event queue batches events and flushes on two triggers: batch size (default 10) or time interval (default 5,000ms). But critical events can't wait:

```ts
const DEFAULT_CRITICAL_EVENTS: TourEventName[] = [
  'tour_completed',
  'tour_abandoned',
  'tour_skipped',
]
```

When a critical event enters the queue, the queue flushes everything pending first (to preserve ordering), then dispatches the critical event immediately. On a throttled 3G connection, batching reduced total network time by 340ms.

The gotcha we hit: an early version dispatched the critical event first, then flushed the queue. Analytics dashboards showed tours "completing" before the last step was viewed. Fixing the flush order solved it.

## Writing a custom plugin in 25 lines

```ts
import type { AnalyticsPlugin, TourEvent } from '@tour-kit/analytics'

interface CustomApiOptions {
  endpoint: string
  apiKey: string
}

export function customApiPlugin(options: CustomApiOptions): AnalyticsPlugin {
  return {
    name: 'custom-api',

    track(event: TourEvent) {
      navigator.sendBeacon(
        options.endpoint,
        JSON.stringify({
          event: event.eventName,
          tourId: event.tourId,
          stepId: event.stepId,
          duration: event.duration,
          timestamp: event.timestamp,
          apiKey: options.apiKey,
        })
      )
    },

    flush() {
      // sendBeacon is fire-and-forget, nothing to flush
    },
  }
}
```

Uses `navigator.sendBeacon` instead of `fetch` because beacon requests survive page unloads. Google's Measurement Protocol docs recommend this pattern for analytics dispatch.

## Per-plugin error isolation

Every `plugin.track()` call is wrapped in try/catch. A plugin that throws never interrupts other plugins and never crashes the tour:

```ts
private dispatchEvents(events: TourEvent[]) {
  for (const event of events) {
    for (const plugin of this.plugins) {
      try {
        plugin.track(event)
      } catch (error) {
        if (this.config.debug) {
          logger.error(`Failed to track in ${plugin.name}:`, error)
        }
      }
    }
  }
}
```

We tested this by deliberately throwing in a custom plugin. The PostHog plugin next in the chain still received every event.

## Bundle impact

The analytics tracker adds ~2KB gzipped. Each built-in plugin adds 0.3-0.8KB. A project using Tour Kit with just PostHog ships 2.3KB of analytics code, versus React Joyride's monolithic 37KB bundle.

Dynamic `import()` in each plugin means the vendor SDK (PostHog is 45KB gzipped) only loads at runtime, not at build time. Tree-shaking removes unused plugins entirely.

## The factory function pattern

Every Tour Kit plugin follows the same pattern: a factory function that returns a typed interface object.

```ts
export function myPlugin(options: MyOptions): AnalyticsPlugin {
  let sdk: SomeSDK | null = null

  return {
    name: 'my-plugin',
    init() { sdk = new SomeSDK(options) },
    track(event) { sdk?.send(event) },
    destroy() { sdk?.close() },
  }
}
```

Not a class. Not an abstract base. Factory functions compose better, close over configuration, and don't require `new`.

---

Full article with comparison table, PostHog source code walkthrough, and common mistakes: [usertourkit.com/blog/building-plugin-system-product-tour-library](https://usertourkit.com/blog/building-plugin-system-product-tour-library)
