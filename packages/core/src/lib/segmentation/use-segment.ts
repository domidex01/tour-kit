import { useMemo } from 'react'
import { matchesAudience } from '../audience'
import { useSegmentationContext } from './segmentation-context'

/**
 * Resolve a named segment to a boolean for the current user.
 *
 * Composition rules:
 * - Inside one segment, conditions are AND-joined by `matchesAudience`.
 * - To express OR, register two named segments and reference both at the
 *   call site, OR use an audience operator that supports OR semantics
 *   (e.g. `operator: 'in'` against an array of values).
 *
 * Returns `false` (with a dev-only `console.warn`) for unknown names — never
 * throws — so a typo cannot crash the consumer tree. Static segments without
 * a `currentUserId` resolve to `false` (anonymous users by definition cannot
 * be in a closed cohort).
 *
 * @example
 *   <SegmentationProvider
 *     segments={{
 *       admins: [{ type: 'user_property', key: 'role', operator: 'equals', value: 'admin' }],
 *       beta:   { type: 'static', userIds: ['u_1', 'u_2'] },
 *     }}
 *     userContext={{ role: 'admin' }}
 *     currentUserId="u_2"
 *   >
 *     <App />
 *   </SegmentationProvider>
 *
 *   useSegment('admins') // → true
 *   useSegment('beta')   // → true
 *   useSegment('ghost')  // → false + dev warn
 */
export function useSegment(name: string): boolean {
  const { segments, userContext, currentUserId } = useSegmentationContext()
  return useMemo(() => {
    const seg = segments[name]
    if (!seg) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[tour-kit] useSegment: unknown segment "${name}"`)
      }
      return false
    }
    // Array.isArray narrows SegmentDefinition (array) vs StaticSegment (object).
    if (!Array.isArray(seg)) {
      return currentUserId !== undefined && seg.userIds.includes(currentUserId)
    }
    return matchesAudience(seg, userContext)
  }, [name, segments, userContext, currentUserId])
}

/**
 * Batch lookup: returns a `Record<string, boolean>` keyed by every registered
 * segment name. Useful for debug overlays and analytics dispatch.
 *
 * Does NOT warn on unknown names — enumeration intentionally walks the
 * registered set, so by definition every key is known.
 */
export function useSegments(): Record<string, boolean> {
  const { segments, userContext, currentUserId } = useSegmentationContext()
  return useMemo(() => {
    const out: Record<string, boolean> = {}
    for (const name of Object.keys(segments)) {
      const seg = segments[name]
      if (!Array.isArray(seg)) {
        out[name] = currentUserId !== undefined && seg.userIds.includes(currentUserId)
      } else {
        out[name] = matchesAudience(seg, userContext)
      }
    }
    return out
  }, [segments, userContext, currentUserId])
}
