/**
 * The one implementation of `RouterAdapter.matchRoute`'s comparison.
 *
 * Every adapter needs the identical three-way switch and, before v2 §1.5f, every
 * adapter had its own copy — three in `@tour-kit/react` and one in each of the
 * two new bindings. Five copies of eight lines is not a style problem: the next
 * adapter gets it subtly wrong, and nothing fails.
 *
 * Pure and path-agnostic on purpose. An adapter owns "what is the current
 * path?"; this owns "does it match?".
 *
 * @module match-route
 */
import type { RouteMatchMode } from '../types/router'

export function matchRoutePattern(
  currentPath: string,
  pattern: string,
  mode: RouteMatchMode = 'exact'
): boolean {
  switch (mode) {
    case 'startsWith':
      return currentPath.startsWith(pattern)
    case 'contains':
      return currentPath.includes(pattern)
    default:
      return currentPath === pattern
  }
}
