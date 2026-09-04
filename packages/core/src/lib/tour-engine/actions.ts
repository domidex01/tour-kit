/**
 * v2 §1.3d — the tour's public verbs, moved behind the port.
 *
 * Every function here takes `ctx: TourEngineContext` first and reads live
 * state through its getters. That is not ceremony: the provider's versions
 * closed over a render-scoped `state` const and needed dependency arrays to
 * stay fresh across `await` boundaries. Reading `ctx.getState()` after an
 * await is correct by construction, which is why the two already-extracted
 * impls (`navigateToStepImpl`, `handleBranchTargetImpl`) work the same way.
 */
import type { BranchContext } from '../../types/branch'
import type { TourCallbackContext } from '../../types/state'
import type { TourEngineContext } from './context'

export function buildBranchContextImpl(
  _ctx: TourEngineContext,
  _action?: string,
  _actionPayload?: unknown
): BranchContext {
  throw new Error('buildBranchContextImpl: not implemented (v2 §1.3d)')
}

/** The single source of truth for ALL completion paths. */
export function completeTourImpl(_ctx: TourEngineContext): void {
  throw new Error('completeTourImpl: not implemented (v2 §1.3d)')
}

/** Mirrors `completeTourImpl` for skip semantics. */
export function skipTourImpl(_ctx: TourEngineContext): void {
  throw new Error('skipTourImpl: not implemented (v2 §1.3d)')
}

export function startImpl(
  _ctx: TourEngineContext,
  _tourId?: string,
  _stepIndex?: number
): Promise<void> {
  throw new Error('startImpl: not implemented (v2 §1.3d)')
}

export function nextImpl(_ctx: TourEngineContext): Promise<void> {
  throw new Error('nextImpl: not implemented (v2 §1.3d)')
}

export function prevImpl(_ctx: TourEngineContext): Promise<void> {
  throw new Error('prevImpl: not implemented (v2 §1.3d)')
}

export function goToImpl(_ctx: TourEngineContext, _stepIndex: number): Promise<void> {
  throw new Error('goToImpl: not implemented (v2 §1.3d)')
}

export function goToStepImpl(_ctx: TourEngineContext, _stepId: string): Promise<void> {
  throw new Error('goToStepImpl: not implemented (v2 §1.3d)')
}

export function startTourImpl(
  _ctx: TourEngineContext,
  _tourId: string,
  _stepId?: string | number
): Promise<void> {
  throw new Error('startTourImpl: not implemented (v2 §1.3d)')
}

export function triggerBranchActionImpl(
  _ctx: TourEngineContext,
  _actionId: string,
  _payload?: unknown
): Promise<void> {
  throw new Error('triggerBranchActionImpl: not implemented (v2 §1.3d)')
}

export function stopImpl(_ctx: TourEngineContext): void {
  throw new Error('stopImpl: not implemented (v2 §1.3d)')
}

export function resetImpl(_ctx: TourEngineContext, _tourId?: string): void {
  throw new Error('resetImpl: not implemented (v2 §1.3d)')
}

/**
 * Still a no-op, exactly as at `tour-provider.tsx:1120`. `createTerminalStore`
 * implements the storage half; nothing calls it. Moved as-is — wiring it up is
 * a behaviour change and belongs after §1.4, not inside a refactor.
 */
export function setDontShowAgainImpl(
  _ctx: TourEngineContext,
  _tourId: string,
  _value: boolean
): void {
  // Implemented in createTerminalStore / usePersistence; deliberately unwired.
}

/** Snapshot shape shared by the tour-level lifecycle callbacks. */
export type ActionCallbackContext = TourCallbackContext
