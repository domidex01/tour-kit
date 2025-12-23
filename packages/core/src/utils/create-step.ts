import type { StepOptions, TourStep } from '../types'

let stepIdCounter = 0

/**
 * Create a step with auto-generated ID
 */
export function createStep(
  target: TourStep['target'],
  content: TourStep['content'],
  options?: Partial<StepOptions>
): TourStep {
  return {
    id: `step-${++stepIdCounter}`,
    target,
    content,
    ...options,
  }
}

/**
 * Create a step with explicit ID
 */
export function createNamedStep(
  id: string,
  target: TourStep['target'],
  content: TourStep['content'],
  options?: Partial<StepOptions>
): TourStep {
  return {
    id,
    target,
    content,
    ...options,
  }
}
