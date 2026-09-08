---
'@tour-kit/core': minor
---

`TourProvider` now runs on `createTourEngine()` through `useSyncExternalStore`. No React API changes.

The provider was a second implementation of the tour engine — a reducer, five "live" refs refreshed every render, four persistence hooks, and ten effects whose declaration order encoded the boot and transition rules. All of that already existed in `@tour-kit/core/engine`; the provider now consumes it instead of duplicating it, and drops from 733 lines to under 400.

Nothing moves for consumers: not `TourProvider`'s props, not `TourContextValue`, not one of the fourteen hooks, not `useTourActions`, not `window.__tourKit__`. The 119 existing provider tests, the 13 boot-parity rows, the hook suites and every `@tour-kit/react` test that mounts the provider pass unmodified — that was the merge gate for this change.

Two things get better in the process:

- **A prop that changes after mount now reaches the engine.** Every router adapter is a memo over its host router's hooks, so the tour follows the current one instead of the one it mounted with.
- **StrictMode behaves.** An autostarted tour starts once, its `onEnter` and the analytics `onTourStart` fire once, and a child's `useEffect(() => start('t'), [])` still works across React's dev-mode remount.

`createTourEngine` also gains `flush()`, which commits the pending throttled flow-session write while leaving the engine live — what a binding needs when an unmount is immediately followed by a remount.
