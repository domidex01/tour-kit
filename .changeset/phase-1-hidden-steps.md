---
"@tour-kit/core": minor
"@tour-kit/react": patch
---

Add hidden / invisible step support: `kind: 'visible' | 'hidden'` and `onEnter` lifecycle on `TourStep`.

- Hidden steps run their `onEnter` (and legacy `onShow`) lifecycle plus `onNext` branching, then auto-advance without mounting any DOM card. Useful for trait-based forks, gating logic, and conditional completion.
- New exports: `validateTour` and `TourValidationError`. `<TourProvider>` calls `validateTour` synchronously at mount; misconfigured hidden steps (carrying `target`, `content`, `title`, `placement`, or `advanceOn`) throw `TourValidationError({ code: 'INVALID_HIDDEN_STEP' })` immediately so consumers see config errors at render time, not at runtime.
- Hidden-step chains are guarded against infinite loops: traversing more than 50 hidden steps in a single navigation throws `TourValidationError({ code: 'HIDDEN_STEP_LOOP' })`.
- `useTourRoute` (`@tour-kit/react`) now defensively returns `currentStepRoute === undefined` when the active step is hidden.

Backwards compatible — `kind` defaults to `'visible'`. Tours without any hidden steps behave bit-for-bit as before.
