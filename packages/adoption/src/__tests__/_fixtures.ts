/**
 * Shared fixtures for funnel / adoption-stats tests.
 *
 * - `sampleSteps` is the canonical 3-step funnel used in `<AdoptionFunnel>` tests.
 * - `mockAdoptionContext` builds an `AdoptionContextValue` that matches the REAL
 *   shape from `src/context/adoption-context.ts`. The hook reads the context via
 *   `useAdoptionStats`, which projects `features` + `usageMap` into
 *   `FeatureWithUsage[]`. We construct both shapes here so tests don't have to.
 */
import type { AdoptionContextValue } from '../context/adoption-context'
import type { AdoptionStatus, Feature, FeatureUsage, FunnelStep } from '../types/feature'

export const sampleSteps: readonly FunnelStep[] = [
  { id: 'view', label: 'Viewed', entered: 100, completed: 60 },
  { id: 'click', label: 'Clicked', entered: 60, completed: 30 },
  { id: 'convert', label: 'Converted', entered: 30, completed: 30 },
]

export interface MockFeatureOptions {
  /** Number of times the user has touched the feature (drives `entered`). */
  useCount: number
  /** Adoption status (`'adopted'` drives `completed > 0`). */
  status: AdoptionStatus
  /** Optional human-readable label override. */
  name?: string
}

export function mockAdoptionContext(
  features: Record<string, MockFeatureOptions>
): AdoptionContextValue {
  const featureList: Feature[] = Object.entries(features).map(([id, opts]) => ({
    id,
    name: opts.name ?? id,
    trigger: { event: id },
  }))
  const usageMap: Record<string, FeatureUsage> = Object.fromEntries(
    Object.entries(features).map(([id, opts]) => [
      id,
      {
        featureId: id,
        firstUsed: opts.useCount > 0 ? '2026-01-01T00:00:00.000Z' : null,
        lastUsed: opts.useCount > 0 ? '2026-01-02T00:00:00.000Z' : null,
        useCount: opts.useCount,
        status: opts.status,
      },
    ])
  )
  return {
    features: featureList,
    usageMap,
    nudgeState: {
      lastShown: null,
      dismissed: [],
      snoozed: {},
      sessionCount: 0,
    },
    trackUsage: () => {},
    getFeature: () => null,
    showNudge: () => {},
    dismissNudge: () => {},
    snoozeNudge: () => {},
    pendingNudges: [],
  }
}
