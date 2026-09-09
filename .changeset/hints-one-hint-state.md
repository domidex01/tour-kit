---
"@tour-kit/hints": patch
---

Fix: `@tour-kit/hints` and `@tour-kit/hints/engine` exported two different `HintState` types.

The package declared its own `HintState` while the engine subpath published core's. The two were byte-identical, so it compiled — but a consumer importing the type from both entry points held two unrelated declarations, and the day either grew a field that would have surfaced as an inscrutable `Map` variance error. `@tour-kit/hints` now re-exports core's, as it already did for `HotspotPosition`. No shape change.

`HintsStorage` is now an alias of core's new `SyncStorage` rather than a third local copy of the same three methods, and `resolveStorage()` returns core's no-op adapter instead of `null` when there is no `window` — the engine's storage field is non-nullable as a result. Neither is visible to a React consumer.
