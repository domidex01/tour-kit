/**
 * Shared test utilities for router adapter tests
 */

import type { RouterAdapter } from '@tour-kit/core'
import { expect } from 'vitest'

/**
 * Type assertion helper to verify an object implements RouterAdapter
 */
export function assertRouterAdapter(adapter: unknown): asserts adapter is RouterAdapter {
  expect(adapter).toHaveProperty('getCurrentRoute')
  expect(adapter).toHaveProperty('navigate')
  expect(adapter).toHaveProperty('matchRoute')
  expect(adapter).toHaveProperty('onRouteChange')
  expect(typeof (adapter as RouterAdapter).getCurrentRoute).toBe('function')
  expect(typeof (adapter as RouterAdapter).navigate).toBe('function')
  expect(typeof (adapter as RouterAdapter).matchRoute).toBe('function')
  expect(typeof (adapter as RouterAdapter).onRouteChange).toBe('function')
}

/**
 * Test helper for exact route matching
 */
export function testMatchRouteExact(
  matchRoute: RouterAdapter['matchRoute'],
  currentPath: string
): void {
  // Exact matches
  expect(matchRoute(currentPath)).toBe(true)
  expect(matchRoute(currentPath, 'exact')).toBe(true)

  // Non-matches
  expect(matchRoute(`${currentPath}/extra`)).toBe(false)
  expect(matchRoute('/completely-different')).toBe(false)
}

/**
 * Test helper for startsWith route matching
 */
export function testMatchRouteStartsWith(
  matchRoute: RouterAdapter['matchRoute'],
  currentPath: string,
  prefix: string
): void {
  const shouldMatch = currentPath.startsWith(prefix)
  expect(matchRoute(prefix, 'startsWith')).toBe(shouldMatch)
}

/**
 * Test helper for contains route matching
 */
export function testMatchRouteContains(
  matchRoute: RouterAdapter['matchRoute'],
  currentPath: string,
  substring: string
): void {
  const shouldMatch = currentPath.includes(substring)
  expect(matchRoute(substring, 'contains')).toBe(shouldMatch)
}

/**
 * Test helper to verify callback stability across rerenders
 */
export function expectStableReference<T>(first: T, second: T, _description: string): void {
  expect(first).toBe(second)
}

/**
 * Common test paths for edge case testing
 */
export const TEST_PATHS = {
  root: '/',
  simple: '/dashboard',
  nested: '/dashboard/settings',
  deeplyNested: '/a/b/c/d/e/f',
  withTrailingSlash: '/path/',
  withQuery: '/path?query=value',
  withHash: '/path#section',
  withQueryAndHash: '/path?query=value#section',
  empty: '',
  unicode: '/chemin/francais',
  encoded: '/path/with%20spaces',
} as const

/**
 * Helper to create a mock callback with tracking
 */
export function createTrackedCallback(): {
  callback: (route: string) => void
  getCalls: () => string[]
  clear: () => void
} {
  const calls: string[] = []

  return {
    callback: (route: string) => {
      calls.push(route)
    },
    getCalls: () => [...calls],
    clear: () => {
      calls.length = 0
    },
  }
}
