import type { AudienceCondition } from '../types/announcement'

/**
 * Check if user context matches audience conditions
 */
export function matchesAudience(
  conditions: AudienceCondition[] | undefined,
  userContext: Record<string, unknown> | undefined
): boolean {
  // No conditions means everyone matches
  if (!conditions || conditions.length === 0) {
    return true
  }

  // No user context means only 'exists' checks can pass
  if (!userContext) {
    return conditions.every((condition) => {
      if (condition.operator === 'not_exists') {
        return true
      }
      return false
    })
  }

  // All conditions must match (AND logic)
  return conditions.every((condition) => matchesCondition(condition, userContext))
}

/**
 * Check if a single condition matches
 */
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
