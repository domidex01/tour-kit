---
"@tour-kit/hints": patch
---

Fix: a throwing subscriber no longer aborts `createHintsEngine`'s notify loop.

`@tour-kit/hints/engine` re-derived core's fan-out without its per-listener `try`/`catch`, so one broken subscriber stopped every listener registered after it from firing — while the frequency-state write to storage inside the same dispatch had already landed. Surviving subscribers were left reading state that storage no longer agreed with, and nothing reported the cause. The engine now uses core's shared `createListeners`, which logs the faulting subscriber and keeps going.

This is reachable by design rather than in theory: the `/engine` subpath exists so non-React consumers can subscribe directly.
