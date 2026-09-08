---
'@tour-kit/core': minor
---

`createTourEngine` gains `setOptions()` and `setDontShowAgain()`, persists terminal tours by default, defers `boot()` on an empty tour list until `setTours()` supplies one, and re-hydrates from cross-tab route writes when `syncTabs` is on.

These are the places `createTourEngine` behaved differently from `<TourProvider>`, which drives the same reducer through the same port. Nothing changes for React consumers — the provider already did all four — but a direct `@tour-kit/core/engine` consumer gets behaviour it was quietly missing:

- **Completed tours are remembered by default.** The engine read `persistence?.enabled ?? false` while the provider merges `defaultPersistenceConfig`, where `enabled` is `true`, and ANDs it with `trackCompleted`. Pass `persistence: { enabled: false }` to keep the old behaviour.
- **`setOptions({ router, autoNavigate, analytics, onNavigationRequired, onStepError, onTourPaused })`** replaces any of the six props that legitimately change identity after construction. Every router adapter is a memo over its host router's hooks, so an engine that froze `router` at construction navigated through a dead adapter after the first route change.
- **`boot()` on an engine with no tours no longer latches.** It defers until `setTours()` supplies some — the shape a declarative registration path produces, where children register after the parent's first pass.
- **`syncTabs` re-hydrates.** `routeStore.subscribeStorage` was built and never called; the first `boot()` now installs it, so another tab's route write restores the tour at its persisted step.
- **`setDontShowAgain(tourId, value)`** is present on `TourEngine`, matching `TourActions`. Its body is still a no-op.
- **The flow session resumes what you actually started.** Its tour id is now kept in sync with engine state rather than set only inside `boot()`, so a tour started from a button, from `startTour()` or by a cross-tour branch writes a resume blob like an autostarted one does. Its storage key is also scoped by `routePersistence.key`, matching the provider — a consumer who set `key` was writing to `tourkit:flow:active` instead of `<key>:flow:active`.
