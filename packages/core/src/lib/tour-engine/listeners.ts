/**
 * The subscriber set every engine keeps, with the one rule that is easy to
 * lose when a second engine is written: **a broken subscriber must not take
 * the engine down with it.**
 *
 * `createTourEngine` had this from the start. `createHintsEngine` (v3 Phase 1)
 * re-derived the same three lines and dropped the try/catch, which is a real
 * fault: a throwing listener aborts the fan-out mid-loop, so listeners
 * registered after it never fire — while the state change and any storage
 * write that preceded the notify have already landed. State, storage and
 * subscribers desync, and nothing surfaces the cause.
 *
 * That is not hypothetical for an `/engine` subpath, whose entire purpose is
 * third-party non-React subscribers. Three more package engines land in v3
 * Phases 2-3 (`checklists`, `announcements`, `surveys`), so this is the shared
 * home rather than a fourth and fifth copy.
 *
 * Deliberately NOT a reducer store. Core's public `getState()` returns a
 * snapshot derived from reducer state via `buildCallbackContext`, hints'
 * returns the reducer state itself, and core notifies outside `dispatch` for
 * `setData`. A shared store would fit one engine and contort the other; the
 * listener set is the part that is genuinely identical in both.
 */
import { logger } from '../../utils/logger'

export interface ListenerSet {
  /** Subscribe. The returned unsubscribe is idempotent. */
  add: (listener: () => void) => () => void
  /**
   * Fan out synchronously — a microtask-coalesced notify would make
   * `getState()` stale immediately after a synchronous dispatch, which is what
   * direct-drive tests depend on. A throwing listener is logged and skipped;
   * every other listener still runs.
   */
  notify: () => void
  /** Drop every listener. Called from `destroy()`. */
  clear: () => void
}

/**
 * @param label - prefix for the warning a throwing listener produces, so the
 *   log names the engine rather than this module.
 */
export function createListeners(label: string): ListenerSet {
  const listeners = new Set<() => void>()

  return {
    add: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    notify: () => {
      for (const listener of listeners) {
        try {
          listener()
        } catch (err) {
          logger.warn(`${label}: listener threw`, err)
        }
      }
    },
    clear: () => {
      listeners.clear()
    },
  }
}
