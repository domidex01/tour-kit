/**
 * `@tour-kit/hints/engine` — the React-free door (v3 Phase 1).
 *
 * The hints state machine, its persistence and the one pure positioning
 * function, with no `react`, `react/jsx-runtime`, `@tour-kit/media`,
 * `@floating-ui/react` or `@radix-ui/react-slot` anywhere in the runtime or
 * `.d.ts` closure. A Vue, Svelte or vanilla consumer runs hints with none of
 * them installed and renders the dot and the tooltip itself.
 *
 * Rules, each with a test behind it (`no-react-in-engine-dist.test.ts`,
 * `subpath-resolution.test.ts`):
 * - Re-exports and comments only. No declaration, no side-effect import.
 * - Everything reachable from here lives under `../lib/hints-engine/` and
 *   imports core ONLY as `@tour-kit/core/engine`. Never `../types` (it imports
 *   React for `RefObject` and `@tour-kit/media` for `MediaSlotProps`), never
 *   `../context`, `../hooks`, `../components`, never `../index`.
 * - `hintsReducer` stays internal, as core withholds `tourReducer`: a reducer
 *   is the seam the binding and the engine share, not a consumer API.
 *
 * "Headless" in this package means UNSTYLED REACT (`@tour-kit/hints/headless`);
 * this entry is the React-free one. Say `/engine` when you mean React-free.
 */
export { createHintsEngine } from '../lib/hints-engine/create-hints-engine'
export type { CreateHintsEngineOptions, HintsEngine } from '../lib/hints-engine/create-hints-engine'
export { INITIAL_HINTS_STATE, createHintsHandle } from '../lib/hints-engine/handle'
export type { HintsHandle } from '../lib/hints-engine/handle'
export type { HintEngineConfig, HintsEngineState, HintsStorage } from '../lib/hints-engine/types'
export { getHotspotPosition } from '../lib/hints-engine/hotspot-position'
export type {
  FrequencyRule,
  FrequencyState,
  HintState,
  HintsActions,
  HotspotPosition,
} from '@tour-kit/core/engine'
