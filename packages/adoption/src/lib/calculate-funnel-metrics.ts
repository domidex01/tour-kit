import type { FunnelStep } from '../types/feature'

/**
 * Computed per-step metrics derived from a `FunnelStep[]`.
 *
 * All percentages are 0..1 (callers format for display). Math is guarded
 * against divide-by-zero so the output never contains `NaN` or `Infinity`.
 */
export interface FunnelStepMetrics {
  id: string
  label: string
  entered: number
  completed: number
  /** `completed / entered`. 0 when `entered === 0`. */
  conversion: number
  /** `entered / prev.entered`. 1 for the first step. */
  retentionFromPrev: number
  /** `prev.entered - entered`. 0 for the first step; clamped to ≥ 0. */
  dropoffFromPrev: number
}

/**
 * Pure helper — no React, no side effects.
 *
 * Empty input returns `[]`. Guards against divide-by-zero in `conversion`
 * and `retentionFromPrev` so the funnel never emits `NaN`/`Infinity`.
 */
export function calculateFunnelMetrics(
  steps: readonly FunnelStep[]
): FunnelStepMetrics[] {
  return steps.map((step, i) => {
    const entered = step.entered
    const completed = step.completed ?? 0
    const prevEntered = i === 0 ? entered : (steps[i - 1]?.entered ?? 0)
    const conversion = entered > 0 ? completed / entered : 0
    const retentionFromPrev =
      i === 0 ? 1 : prevEntered > 0 ? entered / prevEntered : 0
    const dropoffFromPrev = i === 0 ? 0 : Math.max(0, prevEntered - entered)
    return {
      id: step.id,
      label: step.label,
      entered,
      completed,
      conversion,
      retentionFromPrev,
      dropoffFromPrev,
    }
  })
}
