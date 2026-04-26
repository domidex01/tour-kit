---
title: "@tour-kit/analytics"
type: package
package: "@tour-kit/analytics"
version: 0.1.5
sources:
  - ../packages/analytics/CLAUDE.md
  - ../packages/analytics/package.json
  - ../packages/analytics/src/index.ts
updated: 2026-04-26
---

*Plugin-based analytics integration. Tour Kit emits events; plugins forward them to PostHog, Mixpanel, Amplitude, GA4, the console, or any custom destination.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/analytics` |
| Version | 0.1.5 |
| Tier | Pro (license-gated) |
| Deps | `@tour-kit/core`, `@tour-kit/license` |
| Optional peers | `posthog-js`, `mixpanel-browser`, `@amplitude/analytics-browser` |

Plugins assume their underlying SDK is loaded globally — they don't bundle vendor SDKs.

## Public API

### Tracker & provider

```ts
TourAnalytics, createAnalytics       // core tracker
AnalyticsProvider                    // React provider
useAnalytics()                       // throws if not provided
useAnalyticsOptional()               // returns null if not provided
```

### Built-in plugins

```ts
consolePlugin           // debug logging
posthogPlugin           // PostHog
mixpanelPlugin          // Mixpanel
amplitudePlugin         // Amplitude
googleAnalyticsPlugin   // GA4
```

### Plugin interface

```ts
interface AnalyticsPlugin {
  name: string
  track?(event: TourEvent): void
  identify?(userId: string, traits?: Record<string, unknown>): void
  page?(name: string, properties?: Record<string, unknown>): void
}
```

All methods are optional — implement only what you need.

### Types

```ts
TourEvent, TourEventName, TourEventData     // event types
AnalyticsPlugin, AnalyticsConfig            // plugin types
```

## Custom plugin example

```ts
const myPlugin: AnalyticsPlugin = {
  name: 'my-plugin',
  track: (event) => myService.send(event),
}
```

Pass to `createAnalytics({ plugins: [myPlugin, ...] })` or `<AnalyticsProvider plugins={[...]}>`.

## Gotchas

- **Plugin order matters.** Events dispatch to plugins in registration order. If you have rate-limit plugins or sampling plugins, register them first.
- **No SDK loading.** Plugins expect SDKs to be already on `window` (`window.posthog`, `window.mixpanel`, etc.). The plugin doesn't lazy-load them.
- **Optional `useAnalyticsOptional`.** Other Tour Kit packages (e.g. adoption, surveys) call this — they degrade gracefully when no `AnalyticsProvider` is mounted.

## Related

- [packages/core.md](core.md) — emits events that plugins consume
- [packages/license.md](license.md) — gating
- [packages/adoption.md](adoption.md) — auto-wires via `useAdoptionAnalytics()`
- [concepts/plugin-system.md](../concepts/plugin-system.md)
