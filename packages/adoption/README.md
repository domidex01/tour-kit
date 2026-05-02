# @tour-kit/adoption

> React feature adoption tracking — measure which features users actually adopt and re-engage them with contextual nudges.

[![npm version](https://img.shields.io/npm/v/@tour-kit/adoption.svg)](https://www.npmjs.com/package/@tour-kit/adoption)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/adoption.svg)](https://www.npmjs.com/package/@tour-kit/adoption)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/adoption?label=gzip)](https://bundlephobia.com/package/@tour-kit/adoption)
[![types](https://img.shields.io/npm/types/@tour-kit/adoption.svg)](https://www.npmjs.com/package/@tour-kit/adoption)

**Feature adoption tracking** and **nudge system** for React — measure which product features users actually adopt, identify churned features, and surface contextual prompts to drive re-engagement. Ships with an admin dashboard and ready-made conditional render helpers.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Alternative to:** [Pendo](https://www.pendo.io/) adoption analytics, [Userpilot](https://userpilot.com/) feature engagement, [Appcues](https://www.appcues.com/) adoption, [Amplitude](https://amplitude.com/) feature engagement, [FullStory](https://www.fullstory.com/) adoption signals.

## Features

- **Adoption calculator** — combines usage count, adoption window, and recency
- **Churn detection** — flags adopted features that haven't been used recently
- **Nudge scheduler** — cooldowns, trigger conditions, max-per-session caps
- **Conditional render helpers** — `<IfAdopted>` / `<IfNotAdopted>` for inline UI gating
- **Admin dashboard** — `AdoptionDashboard`, `AdoptionTable`, charts, stat cards
- **Analytics auto-wiring** — emits events to `@tour-kit/analytics` when present
- **Headless `<AdoptionNudge>`** with render-prop API
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/adoption @tour-kit/license
# or
pnpm add @tour-kit/adoption @tour-kit/license
```

## Quick Start

```tsx
import { LicenseProvider } from '@tour-kit/license'
import {
  AdoptionProvider,
  useFeature,
  IfNotAdopted,
  NewFeatureBadge,
} from '@tour-kit/adoption'

const features = [
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    trigger: '#dark-mode-toggle',
    adoptionCriteria: { minUses: 3, recencyDays: 30 },
  },
  {
    id: 'export',
    name: 'Export Data',
    trigger: { event: 'export:complete' },
  },
]

function App() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <AdoptionProvider features={features}>
        <YourApp />
      </AdoptionProvider>
    </LicenseProvider>
  )
}

function DarkModeToggle() {
  return (
    <IfNotAdopted featureId="dark-mode">
      <NewFeatureBadge featureId="dark-mode" text="Try dark mode!" />
    </IfNotAdopted>
  )
}

function ExportButton() {
  const { trackUsage, isAdopted, useCount } = useFeature('export')

  const handleExport = async () => {
    await exportData()
    trackUsage()
  }

  return (
    <button onClick={handleExport}>
      Export {!isAdopted && <span>(New!)</span>}
    </button>
  )
}
```

## Adoption status

Features progress through these states:

| Status | Description |
|---|---|
| `not_started` | Never used |
| `exploring` | Used but below `minUses` threshold |
| `adopted` | Meets all adoption criteria (count + recency) |
| `churned` | Was adopted but hasn't been used within the recency window |

A feature is **adopted** when:

1. usage count ≥ required count, **AND**
2. time since first use ≤ adoption window, **AND**
3. recency of last use ≤ churn threshold

Failing #3 marks the feature **churned**.

## Configuration

```tsx
<AdoptionProvider
  features={features}
  storage={{ type: 'localStorage', key: 'my-app-adoption' }}
  nudge={{
    enabled: true,
    cooldown: 86_400_000,      // 24 hours
    maxPerSession: 3,
    maxFeatures: 1,
  }}
  onAdoption={(feature) => analytics.track('feature_adopted', feature)}
  onChurn={(feature) => analytics.track('feature_churned', feature)}
>
  ...
</AdoptionProvider>
```

## Headless nudge

```tsx
import { AdoptionNudge } from '@tour-kit/adoption'

<AdoptionNudge
  featureId="dark-mode"
  render={({ isOpen, dismiss, accept, feature }) => (
    isOpen ? (
      <div className="custom-nudge">
        <h3>Try {feature.name}</h3>
        <button onClick={accept}>Show me</button>
        <button onClick={dismiss}>No thanks</button>
      </div>
    ) : null
  )}
/>
```

## API Reference

### Provider & context

```ts
import { AdoptionProvider, useAdoptionContext } from '@tour-kit/adoption'
```

### Hooks

| Hook | Description |
|---|---|
| `useFeature(id)` | `{ feature, usage, isAdopted, status, useCount, trackUsage }` |
| `useAdoptionStats()` | Aggregate stats across all features |
| `useNudge(id)` | `{ shouldShow, show, dismiss, accept, snooze }` |

### Components

| Export | Purpose |
|---|---|
| `AdoptionNudge` | Declarative nudge UI (also has render-prop API) |
| `FeatureButton` | Auto-emits feature events on click |
| `IfAdopted` / `IfNotAdopted` | Conditional render based on adoption status |
| `NewFeatureBadge` | "New" badge for unadopted features |

### Dashboard

| Export | Purpose |
|---|---|
| `AdoptionDashboard` | Full admin dashboard composition |
| `AdoptionStatsGrid` | Grid of stat cards |
| `AdoptionStatCard` | Single metric card |
| `AdoptionTable` | Feature adoption table with filters |
| `AdoptionCategoryChart` | Bar chart by category |
| `AdoptionStatusBadge` | Color-coded status pill |
| `AdoptionFilters` | Filter controls |

### Engine

```ts
import { emitFeatureEvent } from '@tour-kit/adoption'

emitFeatureEvent('export', { source: 'manual' })
```

Use this when automatic trigger-based tracking isn't possible (e.g. server-side feature use mirrored to the client).

### Analytics helpers

```ts
import {
  useAdoptionAnalytics,
  buildFeatureAdoptedEvent,
  buildFeatureChurnedEvent,
  buildFeatureUsedEvent,
  buildNudgeShownEvent,
  buildNudgeClickedEvent,
  buildNudgeDismissedEvent,
} from '@tour-kit/adoption'
```

`useAdoptionAnalytics()` is a no-op when no `AnalyticsProvider` is mounted — wrap your tree with [`@tour-kit/analytics`](https://www.npmjs.com/package/@tour-kit/analytics) to wire up automatic event emission.

### Variants (CVA) & Slot

```ts
import {
  adoptionNudgeVariants,
  featureButtonVariants,
  newFeatureBadgeVariants,
  Slot, Slottable, UnifiedSlot,
  UILibraryProvider, useUILibrary,
} from '@tour-kit/adoption'
```

### Types

```ts
import type {
  Feature,
  FeatureTrigger,
  AdoptionCriteria,
  FeatureResources,
  FeatureUsage,
  AdoptionStatus,
  FeatureWithUsage,
  StorageConfig,
  NudgeConfig,
  AdoptionProviderProps,
} from '@tour-kit/adoption'
```

## Gotchas

- **Storage prefixes** — adoption uses prefixed storage keys to avoid collisions with tour state.
- **Analytics is opt-in** — `useAdoptionAnalytics()` becomes a no-op without `AnalyticsProvider`.
- **License gate** — components throw / render fallback UI when the license is invalid. Pair with `<LicenseProvider>` in production.

## Related packages

- [`@tour-kit/analytics`](https://www.npmjs.com/package/@tour-kit/analytics) — optional, auto-emits events to PostHog, Mixpanel, Amplitude, GA4
- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — sequential product tours
- [`@tour-kit/hints`](https://www.npmjs.com/package/@tour-kit/hints) — single-element feature hints
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license validation

## Documentation

Full documentation: [https://usertourkit.com/docs/adoption](https://usertourkit.com/docs/adoption)

## License

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.
