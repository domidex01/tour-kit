---
title: "@tour-kit/adoption"
type: package
package: "@tour-kit/adoption"
version: 0.0.6
sources:
  - ../packages/adoption/CLAUDE.md
  - ../packages/adoption/package.json
  - ../packages/adoption/src/index.ts
updated: 2026-04-26
---

*Feature adoption tracking and nudging system. Track which users have adopted which features, run nudges to push adoption, and visualize the data with a dashboard.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/adoption` |
| Version | 0.0.6 |
| Tier | Pro (license-gated via `@tour-kit/license`) |
| Deps | `@tour-kit/core`, `@tour-kit/license`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Optional peers | `@tour-kit/analytics`, `tailwindcss`, `@mui/base` |

## Domain model

| Concept | Meaning |
|---|---|
| **Feature** | Tracked capability — has ID, criteria, triggers, optional resources |
| **Usage** | Count + timestamp record per user |
| **Adoption** | Boolean: does usage meet the feature's criteria? |
| **Nudge** | Prompt shown to push adoption |
| **Churn** | Adopted user who hasn't used the feature within the threshold |

## Public API

### Provider & context

```ts
AdoptionProvider
useAdoptionContext
```

### Hooks

```ts
useFeature(id)      → UseFeatureReturn
useAdoptionStats()  → AdoptionStats
useNudge(id)        → UseNudgeReturn
```

### Components

```ts
AdoptionNudge       // declarative nudge UI; renders via NudgeRenderProps
FeatureButton       // button that auto-emits feature events on click
IfNotAdopted        // conditional render: only when feature NOT adopted
IfAdopted           // conditional render: only when feature IS adopted
NewFeatureBadge     // "New" badge for unadopted features
```

Component prop types: `AdoptionNudgeProps`, `NudgeRenderProps`, `FeatureButtonProps`, `NewFeatureBadgeProps`.

### Dashboard

```ts
AdoptionDashboard, AdoptionStatCard, AdoptionStatsGrid,
AdoptionTable, AdoptionCategoryChart, AdoptionStatusBadge, AdoptionFilters
```

Dashboard prop types: `AdoptionDashboardProps`, `AdoptionStatCardProps`, `AdoptionStatsGridProps`, `AdoptionTableProps`, `AdoptionCategoryChartProps`, `AdoptionStatusBadgeProps`, `AdoptionFiltersProps`, `AdoptionFiltersState`.

### Engine

```ts
emitFeatureEvent(featureId, payload)   // manual event emission
```

The engine layer (`engine/adoption-calculator.ts`, `engine/nudge-scheduler.ts`, `engine/usage-tracker.ts`) is internal. Only `emitFeatureEvent` is exported.

### Analytics helpers

```ts
useAdoptionAnalytics()           // auto-tracks if AnalyticsProvider exists
buildFeatureAdoptedEvent(...)
buildFeatureChurnedEvent(...)
buildFeatureUsedEvent(...)
buildNudgeShownEvent(...)
buildNudgeClickedEvent(...)
buildNudgeDismissedEvent(...)
```

Build helpers ensure every analytics event has the same shape across consumers.

### UI variants & Slot

```ts
adoptionNudgeVariants, featureButtonVariants, newFeatureBadgeVariants
AdoptionNudgeVariants, FeatureButtonVariants, NewFeatureBadgeVariants
cn, Slot, Slottable, UnifiedSlot, UnifiedSlotProps
UILibraryProvider, useUILibrary, UILibrary, UILibraryProviderProps
```

### Types

```ts
Feature, FeatureTrigger, AdoptionCriteria, FeatureResources, FeatureUsage,
AdoptionStatus, FeatureWithUsage, StorageConfig, NudgeConfig, AdoptionProviderProps
```

## Algorithms

### Adoption calculator (`engine/adoption-calculator.ts`)

A feature is **adopted** when:

1. usage count ≥ required count, AND
2. time since first use ≤ adoption window, AND
3. recency of last use ≤ churn threshold

Failing #3 marks the feature **churned** — adopted then abandoned.

### Nudge scheduler (`engine/nudge-scheduler.ts`)

Decides when to show a nudge by checking, in order:

- Cooldown period since last nudge
- Trigger condition (time-based, usage-based, event-based)
- Analytics tracking for impression deduplication

## Gotchas

- **Storage prefixes.** Adoption uses prefixed storage keys to avoid collisions with tour state — never share keys with `@tour-kit/core`'s persistence.
- **Analytics auto-wiring.** `useAdoptionAnalytics()` becomes a no-op when no `AnalyticsProvider` is mounted. Wrap your app accordingly.
- **License gate.** Hooks/components throw or render fallback UI when the license is invalid — `@tour-kit/license` is a hard dep, not optional.

## Related

- [packages/core.md](core.md) — `AdoptionProvider` builds on core's storage adapters
- [packages/license.md](license.md) — licensing gate
- [packages/analytics.md](analytics.md) — optional analytics integration
- [concepts/license-gating.md](../concepts/license-gating.md)
- [architecture/provider-architecture.md](../architecture/provider-architecture.md)
