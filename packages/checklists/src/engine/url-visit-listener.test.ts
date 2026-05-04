import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { countEventOps, spyOnEventListeners } from '../__tests__/history-helpers'
import { __resetForTests, matchesPattern, registerUrlVisitTask } from './url-visit-listener'

describe('matchesPattern', () => {
  it('treats a string as a substring of pathname', () => {
    expect(matchesPattern('/dashboard', '/dashboard/main')).toBe(true)
    expect(matchesPattern('/dashboard', '/about')).toBe(false)
  })

  it('treats a RegExp via .test()', () => {
    expect(matchesPattern(/^\/billing/, '/billing/plan')).toBe(true)
    expect(matchesPattern(/^\/billing/, '/account/billing')).toBe(false)
  })
})

describe('registerUrlVisitTask', () => {
  beforeEach(() => {
    history.replaceState({}, '', '/')
    __resetForTests()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a cleanup function', () => {
    const cleanup = registerUrlVisitTask('a', '/never', () => {})
    expect(typeof cleanup).toBe('function')
    cleanup()
  })

  it('fires onMatch immediately when already on a matching pathname', () => {
    history.replaceState({}, '', '/dashboard/main')
    const onMatch = vi.fn()
    registerUrlVisitTask('a', '/dashboard', onMatch)
    expect(onMatch).toHaveBeenCalledTimes(1)
  })

  it('fires onMatch on pushState navigation and removes the task from registry', () => {
    const onMatch = vi.fn()
    registerUrlVisitTask('a', '/dashboard', onMatch)
    expect(onMatch).not.toHaveBeenCalled()

    history.pushState({}, '', '/dashboard/main')
    expect(onMatch).toHaveBeenCalledTimes(1)

    history.pushState({}, '', '/dashboard/other')
    expect(onMatch).toHaveBeenCalledTimes(1)
  })

  it('detaches popstate listener once the registry empties', () => {
    const spies = spyOnEventListeners()
    const cleanup = registerUrlVisitTask('a', '/never', () => {})
    expect(countEventOps(spies.add, 'popstate')).toBeGreaterThanOrEqual(1)
    cleanup()
    expect(countEventOps(spies.remove, 'popstate')).toBe(countEventOps(spies.add, 'popstate'))
  })
})
