/**
 * Flow session — represents the active tour's `(tourId, stepIndex)` so a
 * hard reload can resume it. Stored as JSON in `sessionStorage` (default)
 * or `localStorage`.
 *
 * Validation strategy: hand-rolled type guard rather than Zod. `@tour-kit/core`
 * does not depend on Zod, and adding it for a 5-field plain-object schema
 * would add bundle weight + a runtime dep. The schema here is the single
 * source of truth for storage shape v1.
 */

export interface FlowSessionV1 {
  schemaVersion: 1
  tourId: string
  stepIndex: number
  /** epoch ms */
  startedAt: number
  /** epoch ms */
  lastUpdatedAt: number
}

function isFlowSessionV1(value: unknown): value is FlowSessionV1 {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.schemaVersion === 1 &&
    typeof v.tourId === 'string' &&
    v.tourId.length > 0 &&
    typeof v.stepIndex === 'number' &&
    Number.isInteger(v.stepIndex) &&
    v.stepIndex >= 0 &&
    typeof v.startedAt === 'number' &&
    Number.isInteger(v.startedAt) &&
    v.startedAt > 0 &&
    typeof v.lastUpdatedAt === 'number' &&
    Number.isInteger(v.lastUpdatedAt) &&
    v.lastUpdatedAt > 0
  )
}

export function serialize(session: FlowSessionV1): string {
  return JSON.stringify(session)
}

/**
 * Parse a raw storage value into a `FlowSessionV1`.
 * Returns `null` on any failure (null/empty input, invalid JSON, wrong shape,
 * wrong schemaVersion). Never throws — callers should remove the blob and
 * continue.
 */
export function parse(raw: string | null): FlowSessionV1 | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return isFlowSessionV1(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Returns true when `session.lastUpdatedAt` is older than `ttlMs`.
 * `ttlMs <= 0` disables expiry (returns false).
 */
export function isExpired(session: FlowSessionV1, ttlMs: number): boolean {
  if (ttlMs <= 0) return false
  return Date.now() - session.lastUpdatedAt > ttlMs
}
