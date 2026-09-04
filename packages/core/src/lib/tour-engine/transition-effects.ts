import { tourRegistry } from '../../registry/tour-registry'
/**
 * v2 §1.3e — everything that must happen *because* the state changed.
 *
 * Seven provider effects used to watch overlapping slices of state and each
 * decide for itself whether its edge had been crossed. They are one function
 * now, taking the before and after snapshots explicitly, so "only on the
 * true → false edge" is a comparison rather than a ref that has to be kept in
 * sync by hand.
 *
 * Not re-entrant: this runs inside `dispatch`, between reduce and notify. It
 * may write storage, post to a channel or update the registry. It may NOT
 * dispatch. Anything needing a second transition — the cross-tab pause — comes
 * back on a later tick through `subscribeCrossTabPause`.
 */
import type { TourCallbackContext } from '../../types/state'
import type { CrossTabActiveMessage, TourEngineContext } from './context'

/**
 * @param prev - Snapshot before the transition.
 * @param next - Snapshot after it.
 */
export function applyTransitionEffects(
  ctx: TourEngineContext,
  prev: TourCallbackContext,
  next: TourCallbackContext
): void {
  // ─── Route-state save ───────────────────────────────────────────────────
  if (next.isActive && ctx.routePersistenceEnabled) {
    ctx.saveRouteState(next)
  }

  // ─── Throttled flow-session save ────────────────────────────────────────
  // `currentRoute` rides along so a hard refresh mid-multi-page-tour resumes
  // on the right URL.
  if (next.isActive && next.tourId && ctx.flowSessionEnabled) {
    ctx.saveFlowSession(next.currentStepIndex, ctx.router?.getCurrentRoute())
  }

  // ─── AbortController swap on tour identity ──────────────────────────────
  // Lets `waitForStepTarget` cancel cleanly instead of resolving a stale
  // navigation onto a tour the user has left.
  if (prev.tourId !== next.tourId || prev.isActive !== next.isActive) {
    ctx.abortControllerRef.current?.abort()
    ctx.abortControllerRef.current = next.isActive ? new AbortController() : null
  }

  // ─── Flow-blob clear, ONLY on the true → false edge ─────────────────────
  // Unconditionally clearing would wipe a freshly restored blob the moment
  // boot() dispatched START_TOUR — the initial snapshot is inactive, so every
  // other comparison would read as "the tour just ended".
  if (prev.isActive && !next.isActive && ctx.flowSessionEnabled) {
    ctx.clearFlowSession()
  }

  // ─── Cross-tab announce ─────────────────────────────────────────────────
  if (next.isActive && next.tourId) {
    ctx.crossTab.lastAnnounceTs = Date.now()
    ctx.announce({
      type: 'tour:active',
      tourId: next.tourId,
      tabId: ctx.tabId,
      ts: ctx.crossTab.lastAnnounceTs,
    })
  }

  // ─── Registry state mirror ──────────────────────────────────────────────
  // The registry only notifies when the slice actually changed, so spurious
  // renders stay clamped to one per real transition.
  mirrorToRegistry(ctx, next)
}

function mirrorToRegistry(ctx: TourEngineContext, next: TourCallbackContext): void {
  for (const id of ctx.getState().tours.keys()) {
    const isThisTourActive = next.isActive && next.tourId === id
    const progress =
      isThisTourActive && next.totalSteps > 0 ? (next.currentStepIndex + 1) / next.totalSteps : 0
    tourRegistry.update(id, {
      isActive: isThisTourActive,
      currentStepId: isThisTourActive ? (next.currentStep?.id ?? null) : null,
      progress,
    })
  }
}

/**
 * Pause this engine's tour when another tab announces one.
 *
 * A lifecycle concern, not a transition: it is installed once and lives until
 * teardown, which is why it is not part of `applyTransitionEffects`.
 *
 * @returns Unsubscribe.
 */
export function subscribeCrossTabPause(
  ctx: TourEngineContext,
  subscribe: (handler: (msg: CrossTabActiveMessage) => void) => () => void
): () => void {
  return subscribe((msg) => {
    if (msg.type !== 'tour:active') return
    if (msg.tabId === ctx.tabId) return

    const state = ctx.getState()
    const pausedTourId = state.tourId
    if (!state.isActive || !pausedTourId) return

    // Tie-break: announcing AFTER the incoming message makes us the newer
    // owner, so we keep running. Without this, two tabs cold-restoring the
    // same session at the same instant pause each other and the user sees no
    // tour anywhere.
    const myTs = ctx.crossTab.lastAnnounceTs
    if (myTs !== null && myTs > msg.ts) return

    ctx.dispatch({ type: 'STOP_TOUR' })
    ctx.onTourPaused?.(pausedTourId, 'cross-tab')
  })
}
