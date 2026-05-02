---
"@tour-kit/core": minor
---

Add `useFlowSession` and `useBroadcast` hooks for active-tour resume and cross-tab pause.

- `routePersistence.flowSession` (opt-in) persists the active tour's `(tourId, stepIndex)` so a hard refresh resumes the tour at the same step. Defaults: `sessionStorage` with 1h TTL, throttled writes (200ms trailing edge).
- `routePersistence.crossTab` (opt-in) coordinates across tabs via `BroadcastChannel`. When tab A starts a tour, any tab with the same active tour id pauses and fires the new `onTourPaused(tourId, 'cross-tab')` callback on `<TourProvider>`.
- New types: `FlowSessionConfig`, `CrossTabConfig`, `UseFlowSessionConfig`, `UseFlowSessionReturn`, `UseBroadcastReturn`.

Both fields are `undefined` by default — apps that don't pass them keep current behavior bit-for-bit. No new runtime dependencies; the `BroadcastChannel`-undefined fallback is a no-op so older Safari users still get a working tour without cross-tab sync.
