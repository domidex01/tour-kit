/**
 * v3 Phase 1 — the binding contract: `createHandle` plus nine hint verbs.
 *
 * On `@tour-kit/hints/engine` from day one. v2 §1.5 had to add core's handle to
 * `/engine` after the fact, once two bindings needed it; this puts hints' there
 * before the first one exists, so the Phase 5 Vue binding and the Vue example
 * in Phase 1 sit on the same object the React provider does.
 *
 * `createHandle` itself is core's — the lifecycle rules (lazy `ensure()`, a
 * listener set that outlives any one engine, a `release()` whose `destroy()` is
 * deferred by a microtask so a StrictMode teardown-and-rerun takes it back) are
 * not tour-specific and are not React-specific either.
 *
 * The handle constructs NOTHING, so a binding may hold it in `useState` and
 * StrictMode's discarded initialiser result is an inert object. The engine is
 * built on the first verb or the boot effect, never in render.
 */
import { createHandle } from '@tour-kit/core/engine'
import type { Handle, HintsActions } from '@tour-kit/core/engine'
import type { HintsEngine } from './create-hints-engine'
import type { HintEngineConfig, HintsEngineState } from './types'

/** One frozen constant: `useSyncExternalStore` compares with `Object.is`. */
export const INITIAL_HINTS_STATE: HintsEngineState = Object.freeze({
  hints: new Map(),
  activeHint: null,
  frequencyState: new Map(),
})

export interface HintsHandle extends Handle<HintsEngine, HintsEngineState>, HintsActions {
  boot: () => void
  setHints: (hints: ReadonlyArray<HintEngineConfig>) => void
}

export function createHintsHandle(factory: () => HintsEngine): HintsHandle {
  const h = createHandle<HintsEngine, HintsEngineState>(factory, INITIAL_HINTS_STATE)
  const e = h.ensure
  return {
    ...h,
    boot: () => e().boot(),
    setHints: (hints) => e().setHints(hints),
    registerHint: (id) => e().registerHint(id),
    unregisterHint: (id) => e().unregisterHint(id),
    showHint: (id) => e().showHint(id),
    hideHint: (id) => e().hideHint(id),
    dismissHint: (id) => e().dismissHint(id),
    resetHint: (id) => e().resetHint(id),
    resetAllHints: () => e().resetAllHints(),
  }
}
