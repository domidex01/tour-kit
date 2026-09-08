---
"@tour-kit/core": minor
---

`@tour-kit/core/engine` publishes the binding contract, and `attachAdvanceOn` no longer rebinds mid-dispatch.

The engine subpath now exports `createEngineHandle`, `pickActions`, `INITIAL_SNAPSHOT`, and the
`EngineHandle`, `TourEngineLiveOptions` and `TourEngineAnalytics` types — the pieces every binding
over `createTourEngine()` is built from. The port (`TourEngineContext`) and the persistence
factories stay unexported.

`attachAdvanceOn` now detaches the outgoing step's listener **synchronously** on a transition and
binds the incoming step's listener **one macrotask later**. Previously it rebound synchronously
inside `notify()`, so a step whose `advanceOn` falls back to `document` could receive the very
real click that advanced onto it and advance again. No React consumer is affected: `<TourProvider>`
drives `advanceOn` through the hook, whose post-commit timing already had the gap.
