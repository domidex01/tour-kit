import type {
  Branch,
  BranchContext,
  BranchSkip,
  BranchTarget,
  BranchToTour,
  BranchWait,
} from '../types/branch'
import { logger } from './logger'

/**
 * Maximum depth for recursive branch resolution
 * Prevents infinite loops from circular branch references
 */
export const MAX_BRANCH_DEPTH = 50

/**
 * Type guard: Check if target is a BranchToTour object
 */
export function isBranchToTour(target: BranchTarget): target is BranchToTour {
  return (
    target !== null &&
    typeof target === 'object' &&
    'tour' in target &&
    typeof (target as BranchToTour).tour === 'string'
  )
}

/**
 * Type guard: Check if target is a BranchSkip object
 */
export function isBranchSkip(target: BranchTarget): target is BranchSkip {
  return (
    target !== null &&
    typeof target === 'object' &&
    'skip' in target &&
    typeof (target as BranchSkip).skip === 'number'
  )
}

/**
 * Type guard: Check if target is a BranchWait object
 */
export function isBranchWait(target: BranchTarget): target is BranchWait {
  return (
    target !== null &&
    typeof target === 'object' &&
    'wait' in target &&
    typeof (target as BranchWait).wait === 'number'
  )
}

/**
 * Check if target is a special navigation keyword
 */
export function isSpecialTarget(
  target: BranchTarget
): target is 'next' | 'prev' | 'complete' | 'skip' | 'restart' {
  return (
    target === 'next' ||
    target === 'prev' ||
    target === 'complete' ||
    target === 'skip' ||
    target === 'restart'
  )
}

/**
 * Check if a branch is a resolver function
 */
export function isBranchResolver(branch: Branch): branch is (context: BranchContext) => BranchTarget | Promise<BranchTarget> {
  return typeof branch === 'function'
}

/**
 * Resolve a branch to its target
 *
 * Handles both static targets and resolver functions.
 * Includes depth tracking to prevent infinite loops.
 *
 * @param branch - The branch to resolve (target or resolver)
 * @param context - The branch context for resolver functions
 * @param depth - Current resolution depth (for loop detection)
 * @returns The resolved branch target
 */
export async function resolveBranch(
  branch: Branch,
  context: BranchContext,
  depth = 0
): Promise<BranchTarget> {
  // Check for infinite loop
  if (depth > MAX_BRANCH_DEPTH) {
    logger.warn(
      `Branch resolution exceeded maximum depth (${MAX_BRANCH_DEPTH}). ` +
        'Possible circular reference detected. Falling back to "next".'
    )
    return 'next'
  }

  // Static target - return as-is
  if (!isBranchResolver(branch)) {
    return branch
  }

  // Resolver function - call it
  try {
    const result = await branch(context)
    return result
  } catch (error) {
    logger.warn('Error resolving branch, falling back to "next":', error)
    return 'next'
  }
}

/**
 * Convert a branch target to a step index
 *
 * @param target - The branch target to convert
 * @param currentIndex - Current step index
 * @param stepIdMap - Map of step ID to index
 * @param totalSteps - Total number of steps in the tour
 * @returns Step index, or null for special targets that don't map to an index
 */
export function resolveTargetToIndex(
  target: BranchTarget,
  currentIndex: number,
  stepIdMap: Map<string, number>,
  totalSteps: number
): number | null {
  // Null - stay on current step
  if (target === null) {
    return currentIndex
  }

  // Number - direct index
  if (typeof target === 'number') {
    // Clamp to valid range
    if (target < 0) return 0
    if (target >= totalSteps) return totalSteps - 1
    return target
  }

  // String - could be step ID or special target
  if (typeof target === 'string') {
    // Check for special targets first
    if (isSpecialTarget(target)) {
      switch (target) {
        case 'next':
          return currentIndex + 1 < totalSteps ? currentIndex + 1 : null
        case 'prev':
          return currentIndex > 0 ? currentIndex - 1 : null
        case 'complete':
        case 'skip':
        case 'restart':
          return null // Special handling required
      }
    }

    // Step ID lookup
    const index = stepIdMap.get(target)
    if (index !== undefined) {
      return index
    }

    logger.warn(`Step ID "${target}" not found in tour`)
    return null
  }

  // BranchToTour - requires special handling
  if (isBranchToTour(target)) {
    return null // Handled separately
  }

  // BranchSkip - relative jump
  if (isBranchSkip(target)) {
    const newIndex = currentIndex + target.skip
    if (newIndex < 0) return 0
    if (newIndex >= totalSteps) return totalSteps - 1
    return newIndex
  }

  // BranchWait - requires special handling
  if (isBranchWait(target)) {
    return null // Handled separately
  }

  return null
}

/**
 * Check if a step has been visited too many times (potential loop)
 *
 * @param stepId - The step ID to check
 * @param visitCount - Map of step ID to visit count
 * @param maxVisits - Maximum allowed visits (default: 10)
 * @returns true if the step has been visited too many times
 */
export function isLoopDetected(
  stepId: string,
  visitCount: Map<string, number>,
  maxVisits = 10
): boolean {
  const count = visitCount.get(stepId) ?? 0
  return count >= maxVisits
}
