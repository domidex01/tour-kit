import type { StepOptions, VisibleTourStep } from '../types'

let stepIdCounter = 0

/**
 * Create a visible step with auto-generated ID. `target` and `content` are
 * required — hidden steps should be authored as object literals because they
 * don't share this surface.
 */
export function createStep(
  target: VisibleTourStep['target'],
  content: VisibleTourStep['content'],
  options?: Partial<StepOptions>
): VisibleTourStep {
  return {
    id: `step-${++stepIdCounter}`,
    target,
    content,
    ...options,
  }
}

/**
 * Create a visible step with an explicit ID.
 */
export function createNamedStep(
  id: string,
  target: VisibleTourStep['target'],
  content: VisibleTourStep['content'],
  options?: Partial<StepOptions>
): VisibleTourStep {
  return {
    id,
    target,
    content,
    ...options,
  }
}
