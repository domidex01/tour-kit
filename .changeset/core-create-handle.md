---
"@tour-kit/core": minor
---

`createHandle`, the engine-agnostic lifecycle primitive behind `createEngineHandle`, exported from `@tour-kit/core/engine`.

`createHandle<E, S>(factory, initial)` is the half of the handle that knows nothing about tours: lazy `ensure()`, a listener set that outlives any one engine, one fan-out on construction, and a `release()` whose `destroy()` is deferred by a microtask so a StrictMode teardown-and-rerun takes it back. `createEngineHandle` is now that composition plus the seventeen tour verbs — its signature and `EngineHandle`'s shape are unchanged, so the React, Vue and Svelte bindings are untouched.

A package that grows its own engine composes `createHandle` instead of writing a second lifecycle. `EngineLike`'s `flush` is optional, so an engine whose writes are synchronous needs none.
