import type * as React from 'react'
import type { RouterAdapter } from '../../types/router'
import type { Tour } from '../../types/tour'
import type { TourAction, TourReducerState } from '../../types/tour-reducer'
import type { TourRouteError } from '../wait-for-step-target'

/**
 * Minimal slice of `TourKitContextValue` consumed by engine functions for
 * analytics fan-out. Declared locally so engine modules do not pull in the
 * full provider type (which would re-introduce a circular import surface).
 */
export interface TourEngineAnalytics {
  onStepView?: (tourId: string, stepId: string, stepIndex: number) => void
  onTourStart?: (tourId: string) => void
  onTourBranch?: (fromTourId: string, toTourId: string, stepId: string) => void
}

/**
 * Engine-scoped context shared by `navigateToStep` and `handleBranchTarget`.
 *
 * Every read-back-mutable value is exposed as a getter or ref. This is
 * deliberate — the engine functions are `await`ed across microtask boundaries
 * and would otherwise capture stale state via closure. The provider builds a
 * stable `engineContextRef` once and updates its `current` on each render.
 */
export interface TourEngineContext {
  // ─── State accessors (getters — read fresh on every call) ────────────────
  getState: () => TourReducerState
  getCurrentTour: () => Tour | null
  getData: () => Record<string, unknown>
  getStepIdMap: () => Map<string, number>

  // ─── Dispatch + refs ─────────────────────────────────────────────────────
  dispatch: React.Dispatch<TourAction>
  abortControllerRef: React.RefObject<AbortController | null>
  completedTourIdRef: React.RefObject<string | null>
  skippedTourIdRef: React.RefObject<string | null>

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

  // ─── Cross-extraction call (handleBranchTarget → navigateToStep) ─────────
  navigateToStep: (stepIndex: number) => Promise<boolean>

  // ─── Analytics fan-out ───────────────────────────────────────────────────
  tourKitContext: TourEngineAnalytics | null
}
