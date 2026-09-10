---
'@tour-kit/surveys': minor
---

Add `@tour-kit/surveys/engine`, a React-free subpath.

The queue, the six fatigue gates, audience evaluation, schedule resolution,
persistence and NPS/CSAT/CES scoring now live in a framework-agnostic engine
that runs in plain Node, Vue, Svelte or a `<script>` tag — no React, no JSX
runtime, no DOM. `<SurveysProvider>` is a thin binding over it and behaves
exactly as before.

Four seams are new on the engine, each defaulting to today's behaviour:

- `setTourActive(active)` — replaces the implicit `useTourContextOptional()`
  coupling, so a non-React consumer can suppress surveys during its own flows.
- `storage` — the adapter is passed in rather than resolved internally.
- `random` — the sampling roll, drawn once at construction as before, now
  injectable so `samplingRate` can be tested deterministically.
- `isScheduleActive` — an injectable evaluator for the optional
  `@tour-kit/scheduling` peer. The default is the existing call-time `require`,
  which degrades open; ESM consumers can now opt into real schedule gating.

`boot()` is async and cancellable: destroying the engine while its storage read
is in flight no longer lands a stale hydration.
