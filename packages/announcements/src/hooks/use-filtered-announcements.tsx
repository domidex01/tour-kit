'use client'

import { useSegments } from '@tour-kit/core'
import * as React from 'react'
import { evaluateAnnouncementAudience as evaluate } from '../lib/announcements-engine/eligibility'
import type { AnnouncementConfig } from '../types/announcement'

/**
 * Segment-audience resolution lives in the ENGINE — `lib/announcements-engine/
 * eligibility.ts` — because the engine owns eligibility (plan Decision 7a) and
 * must answer `show()` / `canShow()` with no React present. Re-exported here
 * under the same name so `import { evaluateAnnouncementAudience } from
 * '@tour-kit/announcements'` is unchanged for consumers.
 *
 * One implementation, deliberately: a second copy on this side would let the
 * hook and the engine disagree about what "segment-eligible" means inside a
 * single package.
 */
export { evaluateAnnouncementAudience } from '../lib/announcements-engine/eligibility'

/**
 * Filter a list of announcement configs by their `audience` prop. Mirror of
 * `@tour-kit/hints`'s `useHintFilter` for `AnnouncementConfig[]`. Uses
 * `useSegments()` (bulk read) once at the top of the provider to satisfy
 * rules-of-hooks under dynamic announcement lists — never call `useSegment`
 * inside `.filter`. Only the segment-shape audience branch is filtered here;
 * array-shape audiences pass through to the scheduler for backward compat.
 */
export function useFilteredAnnouncements(
  announcements: AnnouncementConfig[]
): AnnouncementConfig[] {
  const segments = useSegments()
  return React.useMemo(
    () => announcements.filter((a) => evaluate(a.audience, segments)),
    [announcements, segments]
  )
}
