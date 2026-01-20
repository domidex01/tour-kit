/**
 * Configurable logger utility for tour-kit
 *
 * Provides environment-aware logging with configurable levels.
 * In production, only errors are logged by default.
 * In development, warnings and errors are logged.
 *
 * @example
 * ```ts
 * import { logger } from '@tour-kit/core'
 *
 * // Configure logging level
 * logger.configure({ level: 'debug' })
 *
 * // Use logger
 * logger.debug('Debug info:', data)
 * logger.warn('Warning:', message)
 * logger.error('Error:', error)
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface LoggerConfig {
  level: LogLevel
  prefix?: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

function getDefaultLevel(): LogLevel {
  // Check for production environment in a browser-safe way
  try {
    // Works in Node.js and bundlers that replace process.env.NODE_ENV
    if (
      typeof globalThis !== 'undefined' &&
      // biome-ignore lint/suspicious/noExplicitAny: Checking for Node.js process object
      (globalThis as any).process?.env?.NODE_ENV === 'production'
    ) {
      return 'error'
    }
  } catch {
    // Ignore errors in environments where process is not defined
  }
  return 'warn'
}

let config: LoggerConfig = {
  level: getDefaultLevel(),
  prefix: '[tour-kit]',
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level]
}

export const logger = {
  /**
   * Configure the logger
   */
  configure: (newConfig: Partial<LoggerConfig>): void => {
    config = { ...config, ...newConfig }
  },

  /**
   * Get current logger configuration
   */
  getConfig: (): Readonly<LoggerConfig> => ({ ...config }),

  /**
   * Log debug messages (only in development with level='debug')
   */
  debug: (...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.log(config.prefix, ...args)
    }
  },

  /**
   * Log info messages
   */
  info: (...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.info(config.prefix, ...args)
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(config.prefix, ...args)
    }
  },

  /**
   * Log error messages
   */
  error: (...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(config.prefix, ...args)
    }
  },
}
