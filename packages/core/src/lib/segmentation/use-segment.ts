import { useMemo } from 'react'
import { matchesAudience } from '../audience'
import { useSegmentationContext } from './segmentation-context'

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
    // Array.isArray is the canonical discriminator for SegmentDefinition vs StaticSegment
    // (the plan's verbatim snippet used `'type' in seg`, which TS strict-mode does not
    // narrow cleanly across the array branch — semantically identical, narrowing is tighter).
    if (!Array.isArray(seg)) {
      return currentUserId !== undefined && seg.userIds.includes(currentUserId)
    }
    return matchesAudience(seg, userContext)
  }, [name, segments, userContext, currentUserId])
}
