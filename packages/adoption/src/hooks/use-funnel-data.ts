'use client'

import type { FunnelStep } from '../types/feature'
import { useAdoptionStats } from './use-adoption-stats'

export interface UseFunnelDataInput {
  /** Feature IDs in funnel order. */
  featureIds: readonly string[]
  /** Optional label overrides keyed by feature id. */
  labels?: Partial<Record<string, string>>
}

export interface UseFunnelDataResult {
  /** Funnel steps ready to hand to `<AdoptionFunnel steps>`. */
  steps: FunnelStep[]
  /** Reserved for future async sources. Always `false` for the in-memory provider. */
  loading: boolean
  /** Reserved for future async sources. Always `null` for the in-memory provider. */
  error: Error | null
}

/**
 * Derive a CURRENT-STATE funnel from `useAdoptionStats`.
 *
 * - `entered` is the current user's `useCount` for the feature.
 * - `completed` is `useCount` when `status === 'adopted'`, else `0`.
 *
 * This is per-user, point-in-time data — NOT a historical cohort funnel.
 * For aggregated, date-ranged funnels, hand pre-computed data straight to
 * `<AdoptionFunnel steps={...}>` (the data-first path).
 *
 * No memoization — `featureIds` and `labels` are usually fresh references each
 * render, which would defeat `useMemo`. The mapping is O(featureIds) and the
 * caller's render dominates anyway.
 *
 * Throws via `useAdoptionStats` if used outside `<AdoptionProvider>`.
 */
export function useFunnelData({ featureIds, labels }: UseFunnelDataInput): UseFunnelDataResult {
  const stats = useAdoptionStats()
  const steps: FunnelStep[] = featureIds.map((id) => {
    const feature = stats.features.find((f) => f.id === id)
    const useCount = feature?.usage.useCount ?? 0
    const isAdopted = feature?.usage.status === 'adopted'
    const fallbackLabel = feature?.name ?? id
    return {
      id,
      label: labels?.[id] ?? fallbackLabel,
      entered: useCount,
      completed: isAdopted ? useCount : 0,
    }
  })
  return { steps, loading: false, error: null }
}
