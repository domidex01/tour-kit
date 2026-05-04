import type { ReactNode } from 'react'
import { SegmentationProvider } from './segmentation-context'
import type { SegmentSource } from './types'
import { useSegment, useSegments } from './use-segment'

/**
 * Build a `<SegmentationProvider>` wrapper bound to the given segments map +
 * optional userContext / currentUserId. Returns a component for use inside a
 * `render(...)` call.
 */
export function makeProvider(
  segments: Record<string, SegmentSource>,
  userContext?: Record<string, unknown>,
  currentUserId?: string
) {
  return function TestProvider({ children }: { children: ReactNode }) {
    return (
      <SegmentationProvider
        segments={segments}
        userContext={userContext}
        currentUserId={currentUserId}
      >
        {children}
      </SegmentationProvider>
    )
  }
}

/** Calls `useSegment(name)` and renders the boolean as text in `data-testid="single"`. */
export function SingleSegmentProbe({ name }: { name: string }) {
  const result = useSegment(name)
  return <span data-testid="single">{String(result)}</span>
}

/** Calls `useSegments()` and renders the JSON-serialized record in `data-testid="bulk"`. */
export function BulkSegmentProbe() {
  const out = useSegments()
  return <span data-testid="bulk">{JSON.stringify(out)}</span>
}
