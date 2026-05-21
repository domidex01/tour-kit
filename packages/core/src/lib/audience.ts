/**
 * Promoted from `@tour-kit/announcements` in Phase 1 of the UserGuiding parity
 * initiative. Re-exported there for backward compat — see `packages/announcements/src/core/audience.ts`.
 */
import type { AudienceCondition } from '../types/audience'
import type { GateReason } from '../types/diagnostic'
import type { AudienceProp } from '../types/step'
import { logger } from '../utils/logger'

/**
 * Type guard narrowing `AudienceProp` to its segment-named branch. Previously
 * duplicated in `@tour-kit/react`, `@tour-kit/hints`, and `@tour-kit/announcements`.
 */
export function isSegmentAudience(audience: AudienceProp): audience is { segment: string } {
  return (
    !Array.isArray(audience) &&
    typeof audience === 'object' &&
    audience !== null &&
    'segment' in audience
  )
}

// Module-scope dedupe set: `evaluateAudience` runs inside `Array.filter`
// inside a `useMemo`. Without this set, an unknown segment referenced by N
// steps would emit N warnings on every memo recompute (e.g. on every
// userContext change). Module-scope is fine — segment names are app-wide
// stable. Test isolation: use unique segment names (see
// `packages/core/src/__tests__/_helpers/unique-segment.ts`).
const warnedUnknownSegments = new Set<string>()

/**
 * Pure boolean test: does the current user satisfy this audience? Single
 * source of truth shared by `useStepFilter` (react), `useHintFilter` (hints),
 * and the segment branch of `evaluateAnnouncementAudience` (announcements).
 *
 * - `undefined` audience → `true` (no filter)
 * - segment-shape `{ segment: 'x' }` → reads `segments[x] === true`; warns
 *   once per unknown segment in dev, naming the calling hook.
 * - array-shape `AudienceCondition[]` → delegates to `matchesAudience` with
 *   `userContext` (the legacy contract).
 */
export function evaluateAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>,
  userContext: Record<string, unknown> | undefined,
  caller: string
): boolean {
  if (!audience) return true
  if (isSegmentAudience(audience)) {
    if (
      !(audience.segment in segments) &&
      process.env.NODE_ENV !== 'production' &&
      !warnedUnknownSegments.has(audience.segment)
    ) {
      warnedUnknownSegments.add(audience.segment)
      logger.warn(
        `[tour-kit] ${caller}: references segment "${audience.segment}" not registered in <SegmentationProvider>`
      )
    }
    return segments[audience.segment] === true
  }
  return matchesAudience(audience, userContext)
}

interface AudienceEvaluation {
  matched: boolean
  failingCondition?: AudienceCondition
}

/**
 * Internal shared helper: evaluate an array of conditions against a user
 * context, returning both the boolean outcome AND (on failure) the first
 * condition that did not match. `matchesAudience` projects `.matched`;
 * `explainAudience` reads `.failingCondition` to populate `detail`.
 */
function evaluateConditions(
  conditions: AudienceCondition[] | undefined,
  userContext: Record<string, unknown> | undefined
): AudienceEvaluation {
  if (!conditions || conditions.length === 0) {
    return { matched: true }
  }

  for (const condition of conditions) {
    if (!userContext) {
      if (condition.operator === 'not_exists') continue
      return { matched: false, failingCondition: condition }
    }
    if (!matchesCondition(condition, userContext)) {
      return { matched: false, failingCondition: condition }
    }
  }
  return { matched: true }
}

/**
 * Check if user context matches audience conditions
 */
export function matchesAudience(
  conditions: AudienceCondition[] | undefined,
  userContext: Record<string, unknown> | undefined
): boolean {
  return evaluateConditions(conditions, userContext).matched
}

/**
 * Structured sibling of `matchesAudience` consumed by the diagnostic engine.
 * Returns a `GateReason` describing the audience-gate outcome — including the
 * first failing condition (or the failing segment) in `detail` so operators
 * see WHY the audience filter rejected the user.
 *
 * Segment-form audience (`{ segment: 'admins' }`) looks up
 * `userContext.segments` (a `string[]` listing the user's resolved segments).
 * If the segment is missing or absent, the gate fails with `AUDIENCE_MISMATCH`.
 */
export function explainAudience(
  audience: AudienceProp | undefined,
  userContext: Record<string, unknown> | undefined
): GateReason {
  if (!audience) {
    return { ok: true, gate: 'audience' }
  }

  if (Array.isArray(audience)) {
    const result = evaluateConditions(audience, userContext)
    if (result.matched) return { ok: true, gate: 'audience' }
    // `detail` deliberately omits `userContext` — diagnostic reports are
    // often shipped to telemetry or rendered in dev panels, so the failing
    // condition is enough to explain "why" without leaking unrelated PII.
    return {
      ok: false,
      gate: 'audience',
      code: 'AUDIENCE_MISMATCH',
      message: 'User context did not satisfy audience filter',
      detail: {
        failingCondition: result.failingCondition,
        audience,
      },
    }
  }

  // Segment-form: `{ segment: 'admins' }` — resolved against `userContext.segments`.
  // The user's full segment membership is intentionally NOT echoed back in
  // `detail` (PII / leak vector for telemetry); only the gating segment id is.
  const segment = audience.segment
  const userSegments = userContext?.segments
  const segments = Array.isArray(userSegments) ? userSegments : []
  if (segments.includes(segment)) {
    return { ok: true, gate: 'audience' }
  }
  return {
    ok: false,
    gate: 'audience',
    code: 'AUDIENCE_MISMATCH',
    message: `User is not a member of segment '${segment}'`,
    detail: {
      segment,
      audience,
    },
  }
}

/**
 * Check if a single condition matches
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: condition matching with multiple operators
function matchesCondition(
  condition: AudienceCondition,
  userContext: Record<string, unknown>
): boolean {
  const { key, operator, value } = condition

  // Get the value from user context using dot notation
  const contextValue = getNestedValue(userContext, key)

  switch (operator) {
    case 'equals':
      return contextValue === value

    case 'not_equals':
      return contextValue !== value

    case 'contains':
      if (typeof contextValue === 'string' && typeof value === 'string') {
        return contextValue.includes(value)
      }
      if (Array.isArray(contextValue)) {
        return contextValue.includes(value)
      }
      return false

    case 'not_contains':
      if (typeof contextValue === 'string' && typeof value === 'string') {
        return !contextValue.includes(value)
      }
      if (Array.isArray(contextValue)) {
        return !contextValue.includes(value)
      }
      return true

    case 'in':
      if (Array.isArray(value)) {
        return value.includes(contextValue)
      }
      return false

    case 'not_in':
      if (Array.isArray(value)) {
        return !value.includes(contextValue)
      }
      return true

    case 'exists':
      return contextValue !== undefined && contextValue !== null

    case 'not_exists':
      return contextValue === undefined || contextValue === null

    default:
      return false
  }
}

/**
 * Get a nested value from an object using dot notation
 * Example: getNestedValue({ user: { plan: 'pro' } }, 'user.plan') => 'pro'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/**
 * Validate audience conditions
 */
export function validateConditions(conditions: AudienceCondition[]): string[] {
  const errors: string[] = []

  for (const condition of conditions) {
    if (!condition.key) {
      errors.push('Condition key is required')
    }

    if (!condition.operator) {
      errors.push('Condition operator is required')
    }

    // Value is required for most operators except exists/not_exists
    if (!['exists', 'not_exists'].includes(condition.operator)) {
      if (condition.value === undefined) {
        errors.push(`Value is required for operator '${condition.operator}'`)
      }
    }

    // 'in' and 'not_in' require array values
    if (['in', 'not_in'].includes(condition.operator)) {
      if (!Array.isArray(condition.value)) {
        errors.push(`Value must be an array for operator '${condition.operator}'`)
      }
    }
  }

  return errors
}
