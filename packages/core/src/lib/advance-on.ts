/** v2 §1.3b — RED STUB for the advance-on binder. */
import type { TourStep } from '../types/step'
import { getElement } from '../utils/dom'
import type { TourEngine } from './tour-engine/create-tour-engine'

export function bindStepAdvance(_step: TourStep, _next: () => unknown): () => void {
  throw new Error('bindStepAdvance: not implemented')
}

export function attachAdvanceOn(
  _engine: Pick<TourEngine, 'subscribe' | 'getState' | 'next'>
): () => void {
  throw new Error('attachAdvanceOn: not implemented')
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
