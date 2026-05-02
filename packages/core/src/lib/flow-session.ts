/**
 * Flow session — represents the active tour's `(tourId, stepIndex, currentRoute?)`
 * so a hard reload can resume it. Stored as JSON in `sessionStorage` (default)
 * or `localStorage`.
 *
 * Validation strategy: hand-rolled type guard rather than Zod. `@tour-kit/core`
 * does not depend on Zod, and adding it for a 6-field plain-object schema
 * would add bundle weight + a runtime dep. The guards here are the single
 * source of truth for storage shape v1 and v2.
 *
 * Schema versions:
 * - V1 — original blob: `{ schemaVersion: 1, tourId, stepIndex, startedAt, lastUpdatedAt }`
 * - V2 — adds optional `currentRoute?: string` for cross-page resume.
 *
 * Migration is done in-flight by `parse()` (V1 blobs are accepted and
 * upgraded with `currentRoute: undefined`); writes always emit V2.
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

export interface FlowSessionV2 {
  schemaVersion: 2
  tourId: string
  stepIndex: number
  /**
   * Route the active tour was on at the last save. Used by the provider to
   * resume on the correct URL after a hard refresh on cross-page tours.
   * `undefined` for V1 → V2 migrated blobs and for tours without a router.
   */
  currentRoute?: string
  /** epoch ms */
  startedAt: number
  /** epoch ms */
  lastUpdatedAt: number
}

/**
 * Public alias — always points at the latest schema version. Internal callers
 * should use `FlowSessionV2` directly when they need to reason about wire shape.
 */
export type FlowSession = FlowSessionV2

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasCommonFields(v: Record<string, unknown>): boolean {
  return (
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

function isFlowSessionV1(value: unknown): value is FlowSessionV1 {
  if (!isPlainObject(value)) return false
  return value.schemaVersion === 1 && hasCommonFields(value)
}

function isFlowSessionV2(value: unknown): value is FlowSessionV2 {
  if (!isPlainObject(value)) return false
  if (value.schemaVersion !== 2) return false
  if (!hasCommonFields(value)) return false
  // currentRoute is optional but must be a string when present
  if (value.currentRoute !== undefined && typeof value.currentRoute !== 'string') {
    return false
  }
  return true
}

export function serialize(session: FlowSessionV2): string {
  return JSON.stringify(session)
}

/**
 * Parse a raw storage value into a `FlowSessionV2`.
 *
 * Strategy: try V2 first, then fall back to V1 (migrating to V2 with
 * `currentRoute: undefined`). Returns `null` on any failure (null/empty input,
 * invalid JSON, wrong shape, unknown schemaVersion). Never throws.
 */
export function parse(raw: string | null): FlowSessionV2 | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isFlowSessionV2(parsed)) return parsed
    if (isFlowSessionV1(parsed)) {
      // Migrate in-flight. Write-back happens on next save() — readers should
      // not assume the storage blob has been rewritten yet.
      return {
        schemaVersion: 2,
        tourId: parsed.tourId,
        stepIndex: parsed.stepIndex,
        currentRoute: undefined,
        startedAt: parsed.startedAt,
        lastUpdatedAt: parsed.lastUpdatedAt,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Returns true when `session.lastUpdatedAt` is older than `ttlMs`.
 * `ttlMs <= 0` disables expiry (returns false).
 */
export function isExpired(session: FlowSessionV2, ttlMs: number): boolean {
  if (ttlMs <= 0) return false
  return Date.now() - session.lastUpdatedAt > ttlMs
}
