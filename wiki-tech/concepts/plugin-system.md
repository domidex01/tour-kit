---
title: Plugin system (analytics)
type: concept
sources:
  - ../packages/analytics/src/types/plugin.ts
  - ../packages/analytics/src/core/tracker.ts
  - ../packages/analytics/src/plugins
updated: 2026-04-26
---

*`@tour-kit/analytics` defines a plugin interface. Tour Kit packages emit events; plugins forward them to vendor SDKs. Adding a destination is one object.*

## Interface

```ts
interface AnalyticsPlugin {
  name: string
  track?(event: TourEvent): void
  identify?(userId: string, traits?: Record<string, unknown>): void
  page?(name: string, properties?: Record<string, unknown>): void
}
```

All methods are optional. Implement only what your destination needs.

## Built-in plugins

| Plugin | Vendor SDK expectation |
|---|---|
| `consolePlugin` | none |
| `posthogPlugin` | `window.posthog` (peer: `posthog-js`) |
| `mixpanelPlugin` | `window.mixpanel` (peer: `mixpanel-browser`) |
| `amplitudePlugin` | `window.amplitude` (peer: `@amplitude/analytics-browser`) |
| `googleAnalyticsPlugin` | `window.gtag` |

The plugin **does not** load the SDK. Load it in your app shell (`<Script>` tag, `<head>` tag, dynamic import) and the plugin uses what it finds.

## Tracker

```ts
const analytics = createAnalytics({
  plugins: [posthogPlugin(), consolePlugin({ verbose: true })],
})

// Or via provider
<AnalyticsProvider plugins={[...]}>
```

Events dispatch to plugins **in registration order**.

## Custom plugin

```ts
const slackAlertPlugin: AnalyticsPlugin = {
  name: 'slack-alert',
  track: (event) => {
    if (event.name === 'tour-completed') {
      fetch('/api/slack/alert', { method: 'POST', body: JSON.stringify(event) })
    }
  },
}
```

## Auto-wiring in Pro packages

Pro packages call `useAnalyticsOptional()` rather than `useAnalytics()` so they keep working when no provider is mounted:

- `useAdoptionAnalytics()` (in `@tour-kit/adoption`)
- Internal usage in `@tour-kit/announcements`, `@tour-kit/surveys`, etc.

Each package also exports `build*Event(...)` helpers so event shapes stay consistent across consumers.

## Gotchas

- **No SDK auto-load.** `posthog-js`, `mixpanel-browser`, etc. are **optional peers** of `@tour-kit/analytics`. Install the ones you use.
- **Order matters.** Place rate-limiting or sampling plugins **before** destination plugins — first-match wins for filtering.
- **Plugins are sync.** Don't perform expensive work in `track`; queue and flush asynchronously yourself.

## Related

- [packages/analytics.md](../packages/analytics.md)
- [architecture/provider-architecture.md](../architecture/provider-architecture.md)
