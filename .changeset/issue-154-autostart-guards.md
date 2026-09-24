---
'@tour-kit/core': patch
'@tour-kit/react': patch
'@tour-kit/hints': patch
'@tour-kit/vue': patch
'@tour-kit/svelte': patch
---

Fix step lifecycle hooks on autoStart, and stop the core dep drift that hid the original fix (#154)

**core:** an `autoStart` boot is a cold start, so it now carries the same step
contract as `start()` — the landing step's `onBeforeShow` is asked (a `false`
veto leaves the tour dormant, nothing dispatched) and then `onEnter`. Before,
an autoStart tour fired `onEnter` while silently skipping `onBeforeShow`, so
the hook "worked in core" yet never fired for the most common declarative
path. `flow`/`route` restores are unchanged: they resume mid-tour, where a
veto would strand the user.

**react / hints / vue / svelte:** the `@tour-kit/core` dependency now publishes
as a caret range (`^3.0.0`) instead of an exact pin. `@tour-kit/react@2.0.0`
exact-pinned a nested `core@1.0.7`, so consumers who updated `@tour-kit/core`
to get a fix were still running the stale nested copy inside the provider —
exactly the "fixed in core, still not invoked by TourProvider" report. With a
range, `npm update @tour-kit/core` reaches the provider.
