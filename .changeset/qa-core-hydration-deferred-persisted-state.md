---
'@tour-kit/core': patch
---

Hydration safety: persisted tour state no longer influences the first client
render. `useFlowSession` seeded its state from a render-time storage read, and
`TourProvider` seeded `completedTours`/`skippedTours` from storage in the
reducer's initial state — so the first client render could differ from the
server-rendered HTML, shifting React `useId` tree positions and breaking
hydration for downstream `useId` consumers (seen as an `aria-controls`
mismatch on the checklists launcher). Persisted state now loads in post-mount
effects (new `HYDRATE_TERMINAL_TOURS` action; `useFlowSession` exposes
`ready`), with the flow-session → route-persistence → autoStart precedence
preserved via the `ready` gate. `TourKitProvider`'s `dir="auto"` detection
also no longer reads `document.dir` during the initial render. SSR regression
suite added.
