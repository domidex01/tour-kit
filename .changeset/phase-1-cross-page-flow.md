---
"@tour-kit/core": minor
"@tour-kit/react": minor
---

Cross-page flow continuation: per-step `routeChangeStrategy: 'auto' | 'prompt' | 'manual'` on `TourStep`. The `'auto'` default calls `router.navigate(step.route)`, then awaits the new step's target via the existing `MutationObserver`-based `waitForElement` (3000 ms timeout, 100 ms polling — neither). Surfaces failures as `TourRouteError({ code: 'TARGET_NOT_FOUND' | 'NAVIGATION_REJECTED' | 'TIMEOUT' })` through a new `onStepError` callback on `<TourProvider>`. `'prompt'` defers to `onNavigationRequired`; `'manual'` does nothing — the consumer drives navigation.

The flow session blob is bumped to V2 (`currentRoute?: string` added). `parse()` accepts V1 blobs and migrates in-flight with `currentRoute: undefined`, so apps with persisted V1 sessions continue to load. On mount, if the persisted route differs from the current pathname the provider navigates first, awaits the target, then dispatches `START_TOUR` — a hard refresh during a multi-page tour now resumes on the right URL.

The existing `waitForElement` utility gains an optional `signal: AbortSignal` parameter for cooperative cancellation (default behavior unchanged). The new public exports are `TourRouteError`, `waitForStepTarget`, and the `WaitForStepTargetOptions` type. All three router adapters — Next.js App Router, Next.js Pages Router, and React Router v6/v7 — work without changes.
