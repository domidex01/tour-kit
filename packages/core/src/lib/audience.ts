import type { AudienceCondition } from '../types/audience'

/**
 * PHASE 0 SPIKE — copied verbatim (minus jsdoc tweaks) from
 * packages/announcements/src/core/audience.ts. Promotion to permanent
 * core resident is Phase 1.6 of userguiding-parity-big-plan.md.
 * Reverted at end of Phase 0 — do not ship.
 */

export function matchesAudience(
  conditions: AudienceCondition[] | undefined,
  userContext: Record<string, unknown> | undefined
): boolean {
  if (!conditions || conditions.length === 0) return true
  if (!userContext) {
    return conditions.every((c) => c.operator === 'not_exists')
  }
  return conditions.every((c) => matchesCondition(c, userContext))
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: condition matching with multiple operators
function matchesCondition(
  condition: AudienceCondition,
  userContext: Record<string, unknown>
): boolean {
  const { key, operator, value } = condition
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
      if (Array.isArray(contextValue)) return contextValue.includes(value)
      return false
    case 'not_contains':
      if (typeof contextValue === 'string' && typeof value === 'string') {
        return !contextValue.includes(value)
      }
      if (Array.isArray(contextValue)) return !contextValue.includes(value)
      return true
    case 'in':
      if (Array.isArray(value)) return value.includes(contextValue)
      return false
    case 'not_in':
      if (Array.isArray(value)) return !value.includes(contextValue)
      return true
    case 'exists':
      return contextValue !== undefined && contextValue !== null
    case 'not_exists':
      return contextValue === undefined || contextValue === null
    default:
      return false
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj
  for (const k of keys) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[k]
  }
  return current
}
