# Building a plugin system for a product tour library

## How typed interfaces, event batching, and error isolation make analytics integrations maintainable

*Originally published at [usertourkit.com](https://usertourkit.com/blog/building-plugin-system-product-tour-library)*

Product tour libraries have a plugin problem. React Joyride bakes analytics callbacks into its core props. Shepherd.js hard-codes event emitters. Driver.js has no plugin system at all. None of these approaches let you swap analytics providers without rewriting integration code.

When I built Tour Kit's analytics package, I wanted a plugin interface a developer could implement in 25 lines of TypeScript. One that tree-shakes to zero when unused. One that handles batching, SDK initialization races, and cleanup.

This is a walkthrough of every design decision.

## The interface: 5 methods, 1 required

Tour Kit's AnalyticsPlugin interface exposes a `name` identifier and 5 methods. Only `track` is required:

```
interface AnalyticsPlugin {
  name: string
  init?: () => void | Promise<void>
  track: (event: TourEvent) => void | Promise<void>
  identify?: (userId: string, properties?) => void
  flush?: () => void | Promise<void>
  destroy?: () => void
}
```

A console debug plugin needs just `track`. A PostHog plugin needs all 5. The interface accommodates both without forcing empty method stubs.

## 17 typed events catch bugs at compile time

Tour Kit defines 17 event types across 4 domains (tour lifecycle, step lifecycle, hint interactions, feature adoption) as a TypeScript union type. Writing `'tour_compelted'` fails the type checker. With Shepherd's string-based events, you find out at runtime.

## Event batching with critical event bypass

A 10-step tour generates about 22 events. Firing 22 network requests in sequence kills mobile performance. Tour Kit's event queue batches them (default: 10 events or 5 seconds), reducing network calls to 2-3 flushes.

But some events can't wait. If a user completes a tour and closes the tab, `tour_completed` must fire immediately. Tour Kit's queue flushes pending events first (to preserve ordering), then dispatches the critical event.

The gotcha: an early version dispatched the critical event first, then flushed the queue. Analytics dashboards showed tours "completing" before the last step was viewed.

## Every plugin gets its own try/catch

A broken analytics integration should never crash the tour. Tour Kit wraps every `plugin.track()` in try/catch. We verified this by deliberately throwing in a custom plugin. The PostHog plugin next in the chain still received every event.

React Joyride's callback approach doesn't have this isolation. If your `onStepChange` throws, the tour state update fails.

## 2.3KB for a PostHog-only setup

The tracker adds about 2KB gzipped. Each built-in plugin adds 0.3 to 0.8KB. Dynamic `import()` means vendor SDKs (PostHog is 45KB gzipped) load at runtime only, not at build time.

Compare: React Joyride ships 37KB as one monolithic bundle, regardless of which features you actually use.

## The factory function pattern

Every Tour Kit plugin follows the same pattern: a factory function returning a typed object. Not a class, not an abstract base. Factory functions compose better, close over configuration, and don't require `new`.

Tour Kit doesn't have a visual builder and requires React developers to implement. That's a real limitation. But the plugin system's tree-shaking only works because Tour Kit controls the entire pipeline from event production to dispatch.

---

Full article with comparison table, PostHog source code walkthrough, lifecycle management deep-dive, and 4 common mistakes: [usertourkit.com/blog/building-plugin-system-product-tour-library](https://usertourkit.com/blog/building-plugin-system-product-tour-library)

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
