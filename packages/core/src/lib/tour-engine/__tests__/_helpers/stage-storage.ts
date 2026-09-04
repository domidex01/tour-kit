/**
 * v2 §1.3c — turn a truth-table row into storage state.
 *
 * Uses the *real* serializer so `boot.parity.test.tsx` (which mounts the
 * provider) and `boot.test.ts` (which calls the pure resolver) read identical
 * bytes. A hand-written blob here would let the two files drift and the parity
 * check would prove nothing.
 */
import { type FlowSessionV2, serialize } from '../../../flow-session'

/** Older than the 1 h sessionStorage TTL. */
const STALE_AGE_MS = 2 * 60 * 60 * 1000

export function stageFlow(
  storage: Storage,
  blob: Partial<FlowSessionV2> & { tourId: string },
  opts?: { stale?: boolean; key?: string }
): void {
  const now = Date.now()
  const startedAt = opts?.stale ? now - STALE_AGE_MS : now
  storage.setItem(
    opts?.key ?? 'tourkit:flow:active',
    serialize({
      schemaVersion: 2,
      stepIndex: 0,
      startedAt,
      lastUpdatedAt: startedAt,
      ...blob,
    })
  )
}

export function stageRoute(
  storage: Storage,
  tourId: string,
  stepIndex = 0,
  opts?: { key?: string }
): void {
  storage.setItem(
    opts?.key ?? 'tourkit-route-state',
    JSON.stringify({
      tourId,
      stepIndex,
      completedTours: [],
      skippedTours: [],
      timestamp: Date.now(),
    })
  )
}
