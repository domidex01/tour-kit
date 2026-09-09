/**
 * v3 Phase 1 — the engine's own types, deliberately NOT `../../types`.
 *
 * `packages/hints/src/types/index.ts` imports `react` (for `RefObject`) and
 * `@tour-kit/media` (for `MediaSlotProps`). One `import type` from it would put
 * both in `@tour-kit/hints/engine`'s declaration closure, which is the whole
 * thing the subpath exists to avoid. Every type the engine needs is either
 * declared here or imported from `@tour-kit/core/engine`.
 */
import type { FrequencyRule, FrequencyState, HintState } from '@tour-kit/core/engine'

/** The slice of a hint config the engine reads. `HintConfig` is assignable to it. */
export interface HintEngineConfig {
  id: string
  frequency?: FrequencyRule
}

export interface HintsEngineState {
  hints: Map<string, HintState>
  activeHint: string | null
  frequencyState: Map<string, FrequencyState>
}

export type HintsAction =
  | { type: 'REGISTER'; id: string }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string }
  | { type: 'DISMISS'; id: string }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }
  | { type: 'RECORD_VIEW'; id: string }
  | { type: 'CLEAR_DISMISSAL'; id: string }
  | { type: 'HYDRATE_FREQUENCY'; entries: ReadonlyArray<readonly [string, FrequencyState]> }

/**
 * The SYNCHRONOUS 3-method subset of DOM `Storage` the persistence path reads.
 * `window.localStorage` and the in-memory test mock both satisfy it. Core's
 * `Storage` type permits Promise-returning adapters; those do not work here.
 */
export interface HintsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
