# @tour-kit/analytics

> Plugin-based analytics for React tours & onboarding — ship events to PostHog, Mixpanel, Amplitude, GA4 or any custom backend.

[![npm version](https://img.shields.io/npm/v/@tour-kit/analytics.svg)](https://www.npmjs.com/package/@tour-kit/analytics)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/analytics.svg)](https://www.npmjs.com/package/@tour-kit/analytics)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/analytics?label=gzip)](https://bundlephobia.com/package/@tour-kit/analytics)
[![types](https://img.shields.io/npm/types/@tour-kit/analytics.svg)](https://www.npmjs.com/package/@tour-kit/analytics)

Drop-in **plugin-based analytics** for Tour Kit. Pipe tour, hint, checklist, announcement, and feature-adoption events into **PostHog**, **Mixpanel**, **Amplitude**, **Google Analytics 4**, the console (for debugging), or any custom backend with a tiny plugin object.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Use this when:** you already have your own product analytics stack and want Tour Kit events flowing into it.

## Features

- **5 built-in plugins** — PostHog, Mixpanel, Amplitude, GA4, console
- **Custom plugin in 4 lines** — just an object with optional `track`, `identify`, `page`
- **Plugin chaining** — events dispatch to all registered plugins in order
- **Auto-wired** — adoption, checklists, surveys auto-emit when an `AnalyticsProvider` is mounted
- **No SDK bundling** — plugins assume vendor SDKs are loaded globally; ship your own
- **TypeScript-first**, supports React 18 & 19
- **Tiny** — < 2 KB gzipped

## Installation

```bash
npm install @tour-kit/analytics @tour-kit/license
# or
pnpm add @tour-kit/analytics @tour-kit/license
```

Install the vendor SDK for the plugins you use:

```bash
pnpm add posthog-js                          # for posthogPlugin
pnpm add mixpanel-browser                    # for mixpanelPlugin
pnpm add @amplitude/analytics-browser        # for amplitudePlugin
```

## Quick Start

```tsx
import { LicenseProvider } from '@tour-kit/license'
import { AnalyticsProvider, posthogPlugin, consolePlugin } from '@tour-kit/analytics'
import { TourKitProvider } from '@tour-kit/react'

function App() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <AnalyticsProvider
        plugins={[
          posthogPlugin(),
          process.env.NODE_ENV === 'development' && consolePlugin(),
        ].filter(Boolean)}
      >
        <TourKitProvider>
          <YourApp />
        </TourKitProvider>
      </AnalyticsProvider>
    </LicenseProvider>
  )
}
```

That's it — every Tour Kit event now ships to PostHog automatically.

## Custom plugin

A plugin is just an object. All methods are optional:

```ts
import type { AnalyticsPlugin } from '@tour-kit/analytics'

const myPlugin: AnalyticsPlugin = {
  name: 'my-analytics',
  track: (event) => {
    myService.send(event.name, event.data)
  },
  identify: (userId, traits) => {
    myService.identify(userId, traits)
  },
  page: (name, properties) => {
    myService.page(name, properties)
  },
}
```

Pass it in via `plugins`:

```tsx
<AnalyticsProvider plugins={[myPlugin]}>...</AnalyticsProvider>
```

## Tracked events

Tour Kit auto-emits these events (consuming packages contribute their own — full list in the docs):

| Event | Source |
|---|---|
| `tour_started` / `tour_completed` / `tour_skipped` | `@tour-kit/react` |
| `tour_step_viewed` / `tour_step_completed` | `@tour-kit/react` |
| `hint_shown` / `hint_dismissed` | `@tour-kit/hints` |
| `announcement_shown` / `announcement_dismissed` / `announcement_action_clicked` | `@tour-kit/announcements` |
| `feature_used` / `feature_adopted` / `feature_churned` | `@tour-kit/adoption` |
| `nudge_shown` / `nudge_clicked` / `nudge_dismissed` | `@tour-kit/adoption` |
| `survey_shown` / `survey_completed` / `survey_question_answered` | `@tour-kit/surveys` |
| `checklist_task_completed` / `checklist_completed` | `@tour-kit/checklists` |

Every event payload includes `timestamp` and `sessionId`; tour events also include `tourId`, `stepId`, `stepIndex`, `totalSteps`.

## API Reference

### Provider & hooks

| Export | Description |
|---|---|
| `AnalyticsProvider` | Context provider — accepts `plugins`, `enabled`, `debug` |
| `useAnalytics()` | Access the tracker; **throws** if no provider |
| `useAnalyticsOptional()` | Same, but returns `null` instead of throwing |

### Tracker

| Export | Description |
|---|---|
| `TourAnalytics` | Class implementation of the tracker |
| `createAnalytics(config)` | Tracker factory (use without React context) |

### Built-in plugins

```ts
import {
  consolePlugin,           // debug logging
  posthogPlugin,           // PostHog
  mixpanelPlugin,          // Mixpanel
  amplitudePlugin,         // Amplitude
  googleAnalyticsPlugin,   // GA4
} from '@tour-kit/analytics'
```

Or import from sub-paths:

```ts
import { posthogPlugin } from '@tour-kit/analytics/posthog'
import { mixpanelPlugin } from '@tour-kit/analytics/mixpanel'
import { amplitudePlugin } from '@tour-kit/analytics/amplitude'
import { googleAnalyticsPlugin } from '@tour-kit/analytics/google-analytics'
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

### Types

```ts
import type {
  TourEvent,
  TourEventName,
  TourEventData,
  AnalyticsPlugin,
  AnalyticsConfig,
} from '@tour-kit/analytics'
```

## Disabling analytics

```tsx
// Globally
<AnalyticsProvider enabled={false}>

// Per call
const { track } = useAnalytics()
track({ name: 'custom_event', data: { ... }, skipPlugins: ['posthog'] })
```

## Gotchas

- **Plugin order matters.** Events dispatch in registration order. Register rate-limit / sampling plugins first.
- **No SDK loading.** Plugins expect vendor SDKs to be on `window` (`window.posthog`, `window.mixpanel`, etc.) — the plugin does not lazy-load them.
- **`useAnalyticsOptional()` for shared packages.** Adoption, surveys, and checklists call this — they degrade gracefully when no `AnalyticsProvider` is mounted.

## Related packages

- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — emits tour events
- [`@tour-kit/adoption`](https://www.npmjs.com/package/@tour-kit/adoption) — auto-wires via `useAdoptionAnalytics()`
- [`@tour-kit/checklists`](https://www.npmjs.com/package/@tour-kit/checklists) — emits task completion events
- [`@tour-kit/surveys`](https://www.npmjs.com/package/@tour-kit/surveys) — emits survey events
- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — emits announcement events
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license validation

## Documentation

Full documentation: [https://usertourkit.com/docs/analytics](https://usertourkit.com/docs/analytics)

## License

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.
