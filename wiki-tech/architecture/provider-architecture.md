---
title: Provider architecture
type: architecture
sources:
  - ../CLAUDE.md
  - ../packages/core/src/context
  - ../packages/*/src/context
updated: 2026-04-26
---

*`@tour-kit/core` provides base providers (`TourProvider`, `TourKitProvider`). Each domain package wraps with its own context. All providers support optional analytics integration.*

## Layering

```
<TourKitProvider>                 ← from @tour-kit/core
  <AnalyticsProvider plugins>     ← from @tour-kit/analytics  (optional)
    <LicenseProvider>             ← from @tour-kit/license   (required for Pro)
      <AdoptionProvider>          ← from @tour-kit/adoption
        <ChecklistProvider>
          <AnnouncementsProvider>
            <SurveysProvider>
              <YourApp />
```

Order matters: license must wrap any Pro provider; analytics wraps everything if you want auto-tracking.

## Two roots in core

| Provider | Purpose |
|---|---|
| `TourKitProvider` | App-wide config, direction (LTR/RTL), reduced motion, default a11y/spotlight/keyboard configs |
| `TourProvider` | A single tour instance — wraps `TourKitProvider` and adds tour state (steps, active step, callbacks) |

A `MultiTourKitProvider` (in `@tour-kit/react`) holds a registry of tours and lets consumers trigger any one by ID via `useTours()`.

## Context hooks: throw vs optional

Every package follows the same pattern:

```ts
useFooContext()           // throws if outside <FooProvider>
useFooContextOptional()   // returns null if outside <FooProvider>
```

Throwing is the default. Use `*Optional` only when a feature is genuinely opt-in (e.g. `useAnalyticsOptional` so adoption hooks degrade gracefully without an analytics provider).

## Optional analytics integration

All Pro packages emit events through `@tour-kit/analytics`. They use `useAnalyticsOptional()` so they keep working when the analytics provider isn't mounted.

| Package | Event examples |
|---|---|
| `adoption` | feature-adopted, feature-churned, nudge-shown |
| `announcements` | announcement-shown, announcement-dismissed, action-clicked |
| `checklists` | task-completed, checklist-completed |
| `surveys` | survey-shown, question-answered, survey-completed |
| `core` (tours) | tour-started, step-shown, tour-completed |

## License provider integration

Pro packages don't take `licenseKey` directly — they consume `LicenseContext`. If `<LicenseProvider>` is missing or the license is invalid, Pro components render fallback UI (or a watermark, depending on configuration).

## Related

- [packages/core.md](../packages/core.md)
- [packages/license.md](../packages/license.md)
- [packages/analytics.md](../packages/analytics.md)
- [concepts/license-gating.md](../concepts/license-gating.md)
