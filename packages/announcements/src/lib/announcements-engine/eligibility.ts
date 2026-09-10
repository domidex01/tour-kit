/**
 * Segment eligibility, owned by the engine (plan Decision 7a).
 *
 * `useFilteredAnnouncements` read `useSegments()` from core's React barrel and
 * its `filteredIds` set gated three provider paths — auto-show, `show(id)` and
 * `canShow(id)` — while `REGISTER` used the UNFILTERED list. That asymmetry is
 * why the hints pattern (binding filters, engine receives the filtered list)
 * does not fit: it would make excluded ids unknown to the engine and change
 * what `getConfig`/`getState` return for them.
 *
 * So the engine owns eligibility and the binding forwards one signal:
 * `setSegments(segments)`. The default is `{}`, and core's `evaluateAudience`
 * returns `segments[name] === true`, so every segment audience fails CLOSED
 * until admitted — which is exactly today's behaviour with no
 * `<SegmentationProvider>` mounted.
 */
import { evaluateAudience as coreEvaluateAudience } from '@tour-kit/core/engine'
import type { AudienceProp } from '@tour-kit/core/engine'
import type { EngineAnnouncementConfig } from './types'

/**
 * Resolve a single announcement's audience for the segment-shape branch only.
 *
 * Returns `true` (let through) for `undefined` and array-shape audiences — the
 * array branch is re-checked downstream by the scheduler against `userContext`,
 * which is the legacy contract we must preserve. Only segment-shape audiences
 * are resolved here, because those need a segment map the scheduler has no
 * access to.
 *
 * Moved from `hooks/use-filtered-announcements.tsx` unchanged. It is a public
 * root export (`index.ts`), so the hook file re-exports it under the same name
 * and nothing moves for consumers.
 */
export function evaluateAnnouncementAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>
): boolean {
  if (!audience) return true
  // Array-shape audiences are forwarded to the scheduler unchanged — it owns
  // the legacy `matchesAudience(audience, userContext)` evaluation against the
  // provider's `userContext` prop. (See memory #204 / phase-1 Open Question 1.)
  if (Array.isArray(audience)) return true
  // After the two guards above, `AudienceProp = AudienceCondition[] | { segment: string }`
  // narrows to the segment branch — delegate to core for warn-once + segment lookup.
  // `userContext` is intentionally `undefined`; arrays never reach here.
  return coreEvaluateAudience(audience, segments, undefined, 'useFilteredAnnouncements')
}

/**
 * The ids a given segment map admits, derived from configs rather than stored.
 *
 * Recomputed by all three of the inputs the provider's auto-show effect read:
 * `setAnnouncements`, `setUserContext` and `setSegments`.
 */
export function computeEligibleIds(
  configs: Iterable<EngineAnnouncementConfig>,
  segments: Record<string, boolean>
): Set<string> {
  const ids = new Set<string>()
  for (const config of configs) {
    if (evaluateAnnouncementAudience(config.audience, segments)) ids.add(config.id)
  }
  return ids
}
