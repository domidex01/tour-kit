/**
 * v2 §1.3b — `use-advance-on.ts`'s body as plain functions.
 *
 * Two layers, because two consumers want different things. `bindStepAdvance`
 * binds ONE step and returns its cleanup — that is all the React hook needs,
 * and it makes the hook's `cleanupRef` dance disappear, because the effect
 * cleanup IS the cleanup. `attachAdvanceOn` is the engine-level sugar a
 * non-React binding wants: subscribe once, rebind whenever the current step
 * changes identity.
 *
 * @module advance-on
 */
import type { TourStep } from '../types/step'
import { getElement } from '../utils/dom'
import { logger } from '../utils/logger'

/** Reset delay for the re-entrancy flag, in ms. */
const ADVANCE_DEBOUNCE_MS = 100

/** Authored event names that do not match their DOM event name. */
const EVENT_MAP: Record<string, string> = {
  click: 'click',
  input: 'input',
  custom: 'tourkit:advance',
}

const noop = () => {}

/**
 * Bind one step's `advanceOn` rule.
 *
 * @returns Cleanup. A no-op when the step has no `advanceOn` or there is no
 *   `document`.
 */
export function bindStepAdvance(step: TourStep, next: () => unknown): () => void {
  if (!step.advanceOn || typeof document === 'undefined') return noop

  const { event, selector, handler } = step.advanceOn

  // Get target element (defaults to document)
  const targetElement: Element | Document = selector ? (getElement(selector) ?? document) : document

  if (selector && targetElement === document) {
    logger.warn(`advanceOn: Element "${selector}" not found for step "${step.id}"`)
  }

  // Debounce flag to prevent multiple rapid advances.
  let isAdvancing = false
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  const handleEvent = () => {
    if (isAdvancing) return

    // If handler is provided, it must return true to advance. Note it runs
    // BEFORE the flag is set: a rejected event must leave the window open, or
    // the first accepted event after a rejection is swallowed.
    if (handler) {
      try {
        if (!handler()) return
      } catch (error) {
        logger.warn(`advanceOn handler error for step "${step.id}":`, error)
        return
      }
    }

    isAdvancing = true
    next()

    // Reset after a short delay to handle race conditions.
    resetTimer = setTimeout(() => {
      isAdvancing = false
      resetTimer = null
    }, ADVANCE_DEBOUNCE_MS)
  }

  const domEvent = EVENT_MAP[event] || event
  targetElement.addEventListener(domEvent, handleEvent)

  return () => {
    targetElement.removeEventListener(domEvent, handleEvent)
    // The hook left this timer to fire on a dead closure. Harmless, but a leak.
    if (resetTimer !== null) {
      clearTimeout(resetTimer)
      resetTimer = null
    }
  }
}

/**
 * What this needs from whoever owns the tour. Structural, like
 * `KeyboardActions` and `TestBridgeTarget` — a `TourEngine` satisfies it, and
 * so does anything else that can report a current step and advance. Declared
 * here rather than `Pick<TourEngine, ...>` so this leaf keeps no edge into
 * `lib/tour-engine/`.
 */
export interface AdvanceOnTarget {
  /** Listeners take no arguments and read `getState()` themselves. */
  subscribe(listener: () => void): () => void
  getState(): { isActive: boolean; currentStep: TourStep | null }
  next(): unknown
}

/**
 * Keep one step binding in sync with a target's current step.
 *
 * @returns Detach — unsubscribes and cleans up the live binding. Idempotent.
 */
export function attachAdvanceOn(engine: AdvanceOnTarget): () => void {
  let cleanup = noop
  let bound: TourStep | null = null

  const sync = () => {
    const { isActive, currentStep } = engine.getState()
    const wanted = isActive ? (currentStep ?? null) : null
    // Identity, not id: an author can swap a step's `advanceOn` under the same
    // id via setTours, and the binding has to follow.
    if (wanted === bound) return

    cleanup()
    cleanup = noop
    bound = wanted
    if (wanted) cleanup = bindStepAdvance(wanted, () => engine.next())
  }

  sync()
  const unsubscribe = engine.subscribe(sync)

  return () => {
    unsubscribe()
    cleanup()
    cleanup = noop
    bound = null
  }
}

/**
 * Dispatch a custom advance event (for 'custom' event type)
 * This allows programmatic advancement when the step has advanceOn: { event: 'custom' }
 *
 * @param selector - Optional CSS selector for the target element (defaults to document)
 */
export function dispatchAdvanceEvent(selector?: string): void {
  const target = selector ? getElement(selector) : document
  if (target) {
    target.dispatchEvent(new CustomEvent('tourkit:advance', { bubbles: true }))
  }
}
