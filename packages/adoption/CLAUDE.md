# @tour-kit/adoption

Feature adoption tracking with nudging system.

## Domain Concepts

- **Feature**: A product capability being tracked (has ID, criteria, triggers)
- **Usage**: How many times/when a feature was used
- **Adoption**: Whether usage meets the defined criteria
- **Nudge**: A prompt shown to encourage feature usage

## Key Algorithms

### Adoption Calculator
Located in `engine/adoption-calculator.ts`. Determines adoption status by comparing:
- Actual usage count vs required count
- Time since first use vs adoption window
- Recency of use vs churn threshold

### Nudge Scheduler
Located in `engine/nudge-scheduler.ts`. Decides when to show nudges:
- Respects cooldown periods
- Checks trigger conditions (time-based, usage-based, event-based)
- Integrates with analytics for nudge impression tracking

### Usage Tracker
`emitFeatureEvent()` exported for advanced usage - manually emit events when automatic tracking isn't possible.

## Component Patterns

### Conditional Rendering
```tsx
<IfNotAdopted featureId="dark-mode">
  <NewFeatureBadge featureId="dark-mode" text="Try dark mode!" />
</IfNotAdopted>
```

### Dashboard
Admin components for visualizing adoption metrics:
- `AdoptionDashboard` - Full dashboard
- `AdoptionTable`, `AdoptionCategoryChart`, etc. - Individual widgets

## Gotchas

- **Analytics integration**: `useAdoptionAnalytics()` auto-tracks if analytics provider exists
- **Storage keys**: Uses prefixed storage to avoid collisions with tour state
- **Event builders**: Use `buildFeature*Event()` helpers for consistent event shapes

## Commands

```bash
pnpm --filter @tour-kit/adoption build
pnpm --filter @tour-kit/adoption typecheck
pnpm --filter @tour-kit/adoption test
```

## Related Rules
- `tour-kit/rules/components.md` - Component patterns
- `tour-kit/rules/architecture.md` - Package structure
