import { act, waitFor } from '@testing-library/react'
import { TourKitTestingError } from '../error'

export interface ExpectStepVisibleOptions {
  /** Override the polling deadline. Defaults to 1000ms. */
  timeout?: number
  /**
   * Scope queries to a subtree. Defaults to `document.body` because `<TourCard>`
   * portals to body and consumers won't find it under their render container.
   */
  container?: ParentNode
}

/**
 * Resolve once a `[data-tour-step="<stepId>"]` element is in the DOM.
 *
 * Wraps the Floating UI virtual-element + `act()` microtask flush so consumer
 * tests never need to write `await act(async () => {})` themselves.
 *
 * Throws `TourKitTestingError` with the stepId, helper name, and timeout when
 * the element does not appear inside the deadline.
 */
export async function expectStepVisible(
  stepId: string,
  opts: ExpectStepVisibleOptions = {}
): Promise<HTMLElement> {
  const { timeout = 1000 } = opts
  // Flush Floating UI positioning microtasks before the first query attempt.
  await act(async () => {})

  try {
    const el = await waitFor(
      () => {
        const root: ParentNode = opts.container ?? document.body
        const found = root.querySelector<HTMLElement>(`[data-tour-step="${stepId}"]`)
        if (!found) throw new Error(`step "${stepId}" not in DOM`)
        return found
      },
      { timeout }
    )
    return el
  } catch (e) {
    throw new TourKitTestingError(
      `expectStepVisible: step "${stepId}" not visible within ${timeout}ms`,
      { cause: e, stepId }
    )
  }
}
