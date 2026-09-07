---
'@tour-kit/core': minor
---

Implement the step lifecycle callbacks (#121)

`onBeforeShow`, `onBeforeHide`, `onHide`, `onEnter`/`onShow` on visible steps
and `waitForTarget` on same-route steps were declared on `BaseTourStep` and
documented, but never called. They work now, in this order on every
app-initiated transition:

`onBeforeHide(prev) → onBeforeShow(next) → onEnter(next) → [commit] → onHide(prev) → onShow(next)`

- **`onBeforeShow` / `onBeforeHide` can cancel a transition.** Return a literal
  `false` — including from an `async` guard — and the tour stays where it is.
  Works on `next()`, `prev()` (the reported case), `goTo()`, `start()` and a
  branch to another tour.
- **`waitForTarget: true` now waits on the step's own route**, not only after a
  router hop, for targets rendered after a fetch. Bounded by `waitTimeout`
  (default 3000); on timeout `onStepError` fires with `TARGET_NOT_FOUND`.
- **`onHide` also fires when a tour ends** on a step — `stop()`, `skip()`,
  `complete()`, `reset()`.
- **A callback that throws is logged and ignored, never a veto**, so a buggy
  guard cannot trap a user on one step. This also fixes hidden-step
  `onEnter`/`onShow`, which previously rejected the caller's `next()` promise.

`'restart'` now navigates to step 0 rather than jumping there, so it honours a
hidden or route-bearing first step.
