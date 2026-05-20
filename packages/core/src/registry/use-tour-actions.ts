import * as React from 'react'
import type { UseTourActionsReturn } from '../types/registry'
import { tourRegistry } from './tour-registry'

/**
 * Module-level frozen no-op. Allocated once and reused across every unknown-id
 * call so consumers can safely write `useTourActions(id).start()` during a
 * route transition (before the tour has mounted) without dancing around an
 * `undefined` return.
 *
 * Frozen so any consumer that tries to mutate it (e.g., assigning a callback
 * to `result.start = ...`) gets a clear strict-mode error instead of silently
 * leaking patched no-ops across renders.
 */
const FROZEN_NOOP: UseTourActionsReturn = Object.freeze({
  isActive: false,
  currentStepId: null,
  progress: 0,
  start: () => {
    /* no-op: tour is not registered */
  },
  stop: () => {
    /* no-op: tour is not registered */
  },
  restart: () => {
    /* no-op: tour is not registered */
  },
  next: () => {
    /* no-op: tour is not registered */
  },
  prev: () => {
    /* no-op: tour is not registered */
  },
  goToStep: () => {
    /* no-op: tour is not registered */
  },
})

/**
 * `useSyncExternalStore`'s SSR-safe `getServerSnapshot`. The registry is a
 * module-level singleton populated by client-side effects, so during SSR
 * there's nothing to read — return `null` and let consumers fall through to
 * the frozen no-op.
 */
function getServerSnapshot(): null {
  return null
}

/**
 * Read tour state and call imperative actions from anywhere in the React tree,
 * including siblings of the owning `<TourProvider>` or `<Tour>` component.
 *
 * Standalone `<Tour id="welcome">` self-registers at mount, and any sibling
 * can call `useTourActions('welcome').start()` to drive it. When the tour id
 * is unknown (typo, route transition, future mount), the hook returns a
 * frozen no-op object — calls silently drop rather than throw, so callers
 * don't need to wrap every action in optional chaining.
 *
 * @param tourId - Tour id matching a `<Tour id>` / `<TourProvider tours>` entry
 */
export function useTourActions(tourId: string): UseTourActionsReturn {
  // getSnapshot must return a value whose identity changes when the data
  // changes. The registry replaces `entry.state` wholesale on each transition,
  // so reading `entry?.state` produces a fresh reference each time the state
  // mirror is updated. Returning `entry` itself would keep the same identity
  // across state changes (only the inner `state` field churns), and
  // useSyncExternalStore would never observe an update via Object.is.
  const getSnapshot = React.useCallback(() => tourRegistry.get(tourId)?.state ?? null, [tourId])
  const state = React.useSyncExternalStore(tourRegistry.subscribe, getSnapshot, getServerSnapshot)

  if (!state) return FROZEN_NOOP

  // Post-state-read: re-resolve the entry for its action handles. The entry
  // is the same object whose state we just read, so a follow-up `get(id)`
  // returns null only if the tour unregistered between getSnapshot and here
  // — an unobservable interleaving with the React render commit. Treat that
  // case the same as "unknown id".
  const entry = tourRegistry.get(tourId)
  if (!entry) return FROZEN_NOOP

  return {
    isActive: state.isActive,
    currentStepId: state.currentStepId,
    progress: state.progress,
    start: entry.actions.start,
    stop: entry.actions.stop,
    restart: entry.actions.restart,
    next: entry.actions.next,
    prev: entry.actions.prev,
    goToStep: entry.actions.goToStep,
  }
}
