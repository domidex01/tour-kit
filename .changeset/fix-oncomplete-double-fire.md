---
'@tour-kit/core': patch
'@tour-kit/react': patch
---

Fix `onComplete` and `onSkip` callbacks firing multiple times, which caused `Maximum update depth exceeded` when the parent unmounted the `<Tour>` synchronously inside the callback (issue #6).

- `TourProvider` now consolidates every completion path (`complete()`, `next()` at last step, branch `'complete'` / `'skip'` targets, and the no-visible-step auto-finish) through shared `completeTour` / `skipTour` helpers guarded by tour-id-keyed refs. The guard catches both stale-closure synchronous double-calls and post-`COMPLETE_TOUR` re-firing. Refs are re-armed on `start()` and on cross-tour branch transitions, so legitimate restarts still fire the callbacks.
- `<Tour>` (in `@tour-kit/react`) wraps the consumer-supplied `onComplete` / `onSkip` with the same idempotency guard as a defense-in-depth layer.
