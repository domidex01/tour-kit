import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../../utils/logger'

// The logger module is a singleton. We restore the default level in
// afterEach so cross-file ordering does not leak silence into other suites.
describe('logger.configure level filtering', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.configure({ level: 'warn' })
  })

  afterEach(() => {
    debugSpy.mockRestore()
    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    logger.configure({ level: 'warn' })
  })

  it('silent: suppresses every log method', () => {
    logger.configure({ level: 'silent' })
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('error: only error reaches console', () => {
    logger.configure({ level: 'error' })
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('warn (default): warn + error reach console; debug/info do not', () => {
    logger.configure({ level: 'warn' })
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('info: info + warn + error reach console; debug does not', () => {
    logger.configure({ level: 'info' })
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('debug: all four levels reach console', () => {
    logger.configure({ level: 'debug' })
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(debugSpy).toHaveBeenCalledTimes(1)
    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('configure({ level: "warn" }) restores after a silent block', () => {
    logger.configure({ level: 'silent' })
    logger.warn('first — should be silent')
    expect(warnSpy).not.toHaveBeenCalled()

    logger.configure({ level: 'warn' })
    logger.warn('second — should reach console')
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('prepends the configured prefix on each call', () => {
    logger.configure({ level: 'warn' })
    logger.warn('hello')
    expect(warnSpy).toHaveBeenCalledWith('[tour-kit]', 'hello')
  })

  it('getConfig returns a snapshot, not a live reference', () => {
    logger.configure({ level: 'debug', prefix: '[probe]' })
    const snapshot = logger.getConfig()
    logger.configure({ level: 'silent' })
    expect(snapshot.level).toBe('debug')
    expect(snapshot.prefix).toBe('[probe]')
  })
})
