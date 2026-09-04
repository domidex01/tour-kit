/**
 * v2 §1.3b — `use-flow-session.ts` as a plain factory.
 *
 * The one adapter with real local state. Two contracts here look like dead
 * weight to a cold reader and are not:
 *
 * 1. **Construction reads nothing.** The hook's `ready` flag exists because a
 *    render-time storage read shifts React's `useId` tree positions and breaks
 *    hydration for unrelated downstream consumers (`use-flow-session.ts:105`).
 *    The factory keeps the property: `load()` is the only reader, and nobody
 *    calls it from the constructor.
 * 2. **`setItem` failures are swallowed.** A full quota must not end the tour.
 */
import type { FlowSessionV2 } from '../../flow-session'
import type { FlowSessionConfig } from '../../../types/config'

export interface CreateFlowSessionConfig extends FlowSessionConfig {
  /** Storage key prefix (default: `tourkit`). Full key is `${keyPrefix}:flow:active`. */
  keyPrefix?: string
}

export interface FlowSessionStore {
  /** The only storage read. Never called during construction. */
  load: () => FlowSessionV2 | null
  /** Trailing-edge throttled at 200 ms. A burst coalesces into one write. */
  save: (stepIndex: number, currentRoute?: string) => void
  clear: () => void
  /** True when the last loaded/saved session is past its TTL. */
  isStale: () => boolean
  /** Write any pending throttled save immediately. Call on teardown. */
  flush: () => void
  /** The tour id `save()` stamps into new blobs. `''` disables writes. */
  setTourId: (tourId: string) => void
}

export function createFlowSession(
  _config?: CreateFlowSessionConfig,
  _storage?: Storage
): FlowSessionStore {
  throw new Error('createFlowSession: not implemented (v2 §1.3b)')
}
