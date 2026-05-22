import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tourRegistry } from '../../registry/tour-registry'
import type { RegistryEntry } from '../../registry/tour-registry'
import { logger } from '../../utils/logger'

function makeEntry(id: string): RegistryEntry {
  return {
    id,
    state: { isActive: false, currentStepId: null, progress: 0 },
    actions: {
      start: () => {},
      stop: () => {},
      restart: () => {},
      next: () => {},
      prev: () => {},
      goToStep: () => {},
    },
  }
}

describe('tourRegistry duplicate-id registration (migrated to logger)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tourRegistry.__reset__?.()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.configure({ level: 'warn' })
  })

  afterEach(() => {
    tourRegistry.__reset__?.()
    errorSpy.mockRestore()
    logger.configure({ level: 'warn' })
  })

  it('logs an error when the same id registers twice (default level)', () => {
    const id = `tour-${Math.random().toString(36).slice(2, 8)}`
    tourRegistry.register(makeEntry(id))
    tourRegistry.register(makeEntry(id))
    const matched = errorSpy.mock.calls.filter((c: unknown[]) =>
      String(c[1] ?? '').includes('registered twice')
    )
    expect(matched.length).toBeGreaterThanOrEqual(1)
  })

  it('emits nothing to console.error when logger is silent', () => {
    logger.configure({ level: 'silent' })
    const id = `tour-${Math.random().toString(36).slice(2, 8)}`
    tourRegistry.register(makeEntry(id))
    tourRegistry.register(makeEntry(id))
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('routes through logger.error, not direct console.error', () => {
    const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const id = `tour-${Math.random().toString(36).slice(2, 8)}`
    tourRegistry.register(makeEntry(id))
    tourRegistry.register(makeEntry(id))
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    loggerErrorSpy.mockRestore()
  })
})
