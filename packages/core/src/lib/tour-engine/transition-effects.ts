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
  // Every side-effect below is gated on a real prev -> next change.
  //
  // Adapter B calls this once per reducer transition, where the comparison is
  // redundant. Adapter A calls it on EVERY commit — the transition is decided
  // by comparing snapshots, not by a dep array — so without these gates an
  // inert re-render re-writes storage and re-announces to every other tab.
  // That is not merely wasteful: a fresh announce carries a fresh timestamp,
  // and `subscribeCrossTabPause` stops any tab whose own announce is older, so
  // a re-rendering tab would repeatedly pause tours in other tabs.
  //
  // The gates below reproduce the dep arrays the seven pre-§1.3e effects had.
  const identityChanged = prev.tourId !== next.tourId || prev.isActive !== next.isActive
  const positionChanged = identityChanged || prev.currentStepIndex !== next.currentStepIndex

  // ─── Route-state save ───────────────────────────────────────────────────
  if (next.isActive && ctx.routePersistenceEnabled && positionChanged) {
    ctx.saveRouteState(next)
  }

  // ─── Throttled flow-session save ────────────────────────────────────────
  // `currentRoute` rides along so a hard refresh mid-multi-page-tour resumes
  // on the right URL.
  if (next.isActive && next.tourId && ctx.flowSessionEnabled && positionChanged) {
    ctx.saveFlowSession(next.currentStepIndex, ctx.router?.getCurrentRoute())
  }

  // ─── AbortController swap on tour identity ──────────────────────────────
  // Lets `waitForStepTarget` cancel cleanly instead of resolving a stale
  // navigation onto a tour the user has left.
  if (identityChanged) {
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
  if (next.isActive && next.tourId && identityChanged) {
    ctx.crossTab.lastAnnounceTs = Date.now()
    ctx.announce({
      type: 'tour:active',
      tourId: next.tourId,
      tabId: ctx.tabId,
      ts: ctx.crossTab.lastAnnounceTs,
    })
  }

  // ─── Registry state mirror ──────────────────────────────────────────────
  // Deliberately ungated: this must also pick up a tours-set change, which
  // neither `identityChanged` nor `positionChanged` sees. It is cheap and
  // self-de-duplicating — `tourRegistry.update` compares the slice field by
  // field and notifies only on a real change, so an inert commit costs a Map
  // walk and no subscriber renders.
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
