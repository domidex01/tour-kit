// v2 §1.4b — the structural claims Decision 2 makes about `EngineHandle`.
//
// Vitest never loads `*.test-d.ts` (its include glob is `*.{test,spec}.{ts,tsx}`);
// these are compiled by `pnpm --filter @tour-kit/core typecheck:types` and by
// the plain `typecheck`, both of which fail on any error below.
//
// Why the first line is the load-bearing one: `attachAdvanceOn` and
// `attachTestBridge` take hand-written interfaces (`AdvanceOnTarget`,
// `TestBridgeTarget`), each strictly *looser* than a `Pick<TourEngine, …>`.
// So passing the handle to them compiles for almost any object and proves
// little on its own. `Omit<TourEngine, 'destroy'>` is what Decision 2 actually
// claims — the handle IS a `TourEngine` minus the terminal verb — and it is
// what lets a future consumer take either.

import { attachAdvanceOn } from '../../lib/advance-on'
import { attachTestBridge } from '../../lib/test-bridge'
import type { TourEngine } from '../../lib/tour-engine/create-tour-engine'
import type { EngineHandle } from '../../lib/tour-engine/engine-handle'

declare const handle: EngineHandle

// ─── The claim: a TourEngine minus the terminal verb ────────────────────────
const _engineShaped: Omit<TourEngine, 'destroy'> = handle
void _engineShaped

// `release()` replaces it, because the handle outlives its engines.
// @ts-expect-error — `destroy` is deliberately not on the handle.
handle.destroy()

// ─── Both §1.3b attach targets accept it unchanged ──────────────────────────
const _detachAdvanceOn: () => void = attachAdvanceOn(handle)
void _detachAdvanceOn

const _detachBridge: () => void = attachTestBridge({
  start: (tourId) => handle.start(tourId),
  next: () => handle.next(),
  prev: () => handle.prev(),
  goToStep: (stepId) => handle.goToStep(stepId),
  complete: () => handle.complete(),
  skip: () => handle.skip(),
})
void _detachBridge
