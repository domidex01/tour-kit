import type { BranchTarget } from '../../types/branch'
import type { TourDispatch, TourRef } from '../../types/primitives'
import type { RouterAdapter } from '../../types/router'
import type { TourState } from '../../types/state'
import type { Tour } from '../../types/tour'
import type { TourAction, TourReducerState } from '../../types/tour-reducer'
import type { TourRouteError } from '../wait-for-step-target'

/** Cross-tab "I am running a tour" announcement. */
export interface CrossTabActiveMessage {
  type: 'tour:active'
  tourId: string
  tabId: string
  ts: number
}

/**
 * Minimal slice of `TourKitContextValue` consumed by engine functions for
 * analytics fan-out. Declared locally so engine modules do not pull in the
 * full provider type (which would re-introduce a circular import surface).
 */
export interface TourEngineAnalytics {
  onStepView?: (tourId: string, stepId: string, stepIndex: number) => void
  onTourStart?: (tourId: string) => void
  onTourBranch?: (fromTourId: string, toTourId: string, stepId: string) => void
  // The provider has always fanned out to these three as well; §1.3d moves the
  // call sites behind the port, so the port has to declare them.
  onTourComplete?: (tourId: string) => void
  onTourSkip?: (tourId: string, stepIndex: number) => void
  onBranchAction?: (tourId: string, stepId: string, actionId: string, target: BranchTarget) => void
}

/**
 * Engine-scoped context shared by `navigateToStep` and `handleBranchTarget`.
 *
 * Every read-back-mutable value is exposed as a getter or ref so the engine
 * impls see fresh state across `await` boundaries. The provider holds a set
 * of long-lived "live" refs (`stateRef`, `currentTourRef`, `dataRef`,
 * `stepIdMapRef`) that are refreshed each render to mirror the latest
 * committed values; the getters here close over those refs, NOT over a
 * render-scoped `state` const. As a result, even if an engine impl captures
 * `ctx` during render N, calling `ctx.getState()` after a state-changing
 * dispatch reads the render-N+1 value through the shared ref.
 *
 * `engineContextRef` itself is rebuilt each render so non-getter fields
 * (`router`, `autoNavigate`, consumer callbacks) stay current.
 */
export interface TourEngineContext {
  // ─── State accessors (getters — read fresh on every call) ────────────────
  getState: () => TourReducerState
  getCurrentTour: () => Tour | null
  getData: () => Record<string, unknown>
  getStepIdMap: () => Map<string, number>

  // ─── Dispatch + refs ─────────────────────────────────────────────────────
  dispatch: TourDispatch<TourAction>
  abortControllerRef: TourRef<AbortController | null>
  completedTourIdRef: TourRef<string | null>
  skippedTourIdRef: TourRef<string | null>

  // ─── Config (static for the provider's lifetime) ─────────────────────────
  router?: RouterAdapter
  autoNavigate: boolean
  maxHiddenChain: number

  // ─── Consumer callbacks ──────────────────────────────────────────────────
  onNavigationRequired?: (route: string, stepId: string) => void
  onStepError?: (err: TourRouteError) => void

  // ─── Provider-owned helpers ──────────────────────────────────────────────
  completeTour: () => void
  skipTour: () => void
  setData: (key: string, value: unknown) => void

  // ─── Terminal-tour persistence (v2 §1.3d) ────────────────────────────────
  // The engine decides *whether* to persist; the adapter behind these decides
  // *where*. `persistTerminalTours` mirrors the provider's merged
  // enabled && trackCompleted gate.
  persistTerminalTours: boolean
  markCompleted: (tourId: string) => void
  markSkipped: (tourId: string) => void
  resetPersistence: (tourId?: string) => void
  /** Drop the multi-page route blob — a finished tour must not resume. */
  clearRouteState: () => void

  // ─── Transition sinks (v2 §1.3e) ─────────────────────────────────────────
  // Where `applyTransitionEffects` writes. Kept as flat callbacks rather than
  // stores so the React adapter can pass its hook results straight through and
  // the plain-store adapter can pass its factories'.
  saveRouteState: (state: TourState) => void
  saveFlowSession: (stepIndex: number, currentRoute?: string) => void
  clearFlowSession: () => void
  routePersistenceEnabled: boolean
  flowSessionEnabled: boolean

  // ─── Cross-tab (v2 §1.3e) ────────────────────────────────────────────────
  /** This engine's identity on the channel — used to drop our own echoes. */
  tabId: string
  announce: (msg: CrossTabActiveMessage) => void
  /**
   * Mutable, and deliberately so. `lastAnnounceTs` is the tie-break: if we
   * announced AFTER an incoming message, we are the newer owner and keep
   * running. Without it, two tabs cold-restoring the same session at the same
   * instant pause each other and the user sees no tour anywhere.
   */
  crossTab: { lastAnnounceTs: number | null }
  onTourPaused?: (tourId: string, reason: 'cross-tab') => void

  // ─── Cross-extraction call (handleBranchTarget → navigateToStep) ─────────
  navigateToStep: (stepIndex: number) => Promise<boolean>

  // ─── Analytics fan-out ───────────────────────────────────────────────────
  tourKitContext: TourEngineAnalytics | null
}
