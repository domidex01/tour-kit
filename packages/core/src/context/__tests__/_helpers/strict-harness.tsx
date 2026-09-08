/**
 * v2 §1.4c — the two probes the StrictMode cases need.
 *
 * Neither belongs in a test file: both are components, and both are used by
 * more than one case.
 */
import * as React from 'react'
import { useTourContext } from '../../tour-context'

/**
 * A child whose MOUNT EFFECT starts a tour.
 *
 * This is the documented "start on mount" pattern and the reason the engine
 * handle exists: React runs child effects BEFORE the parent's, so this call
 * lands before the provider's own boot effect and must still find an engine.
 * Under StrictMode it runs twice, with the provider's cleanup in between.
 */
export function StartOnMount({ tourId }: { tourId: string }) {
  const { start } = useTourContext()
  React.useEffect(() => {
    void start(tourId)
  }, [start, tourId])
  return null
}

/** Captures action identities on every render so a test can compare across a remount. */
export function IdentityProbe({ seen }: { seen: React.RefObject<unknown[]> }) {
  const { start, next, goToStep } = useTourContext()
  seen.current?.push(start, next, goToStep)
  return null
}
