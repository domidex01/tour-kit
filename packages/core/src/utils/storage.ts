// Alias the project's narrow 3-method `Storage` adapter type so it doesn't
// shadow the DOM `globalThis.Storage` shape used by `createMemoryStorage`.
import type { PersistenceConfig, Storage as StorageAdapter } from '../types'

/**
 * Create storage adapter from config
 */
export function createStorageAdapter(storageType: PersistenceConfig['storage']): StorageAdapter {
  if (typeof storageType === 'object') {
    return storageType
  }

  if (typeof window === 'undefined') {
    return createNoopStorage()
  }

  switch (storageType) {
    case 'sessionStorage':
      return window.sessionStorage
    case 'cookie':
      return createCookieStorage()
    default:
      return window.localStorage
  }
}

/**
 * No-op storage for SSR
 */
export function createNoopStorage(): StorageAdapter {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
}

/**
 * Escape regex metacharacters so arbitrary cookie keys (which may include
 * `.`, `:`, `-`, etc. after prefixing) can be matched literally.
 */
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Cookie-based storage adapter
 */
export function createCookieStorage(
  options: { expires?: number; path?: string } = {}
): StorageAdapter {
  const { expires = 365, path = '/' } = options

  return {
    getItem: (key: string) => {
      if (typeof document === 'undefined') return null
      const match = document.cookie.match(new RegExp(`(^| )${escapeRegex(key)}=([^;]+)`))
      return match ? decodeURIComponent(match[2]) : null
    },

    setItem: (key: string, value: string) => {
      if (typeof document === 'undefined') return
      const date = new Date()
      date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000)
      document.cookie = `${key}=${encodeURIComponent(
        value
      )};expires=${date.toUTCString()};path=${path}`
    },

    removeItem: (key: string) => {
      if (typeof document === 'undefined') return
      document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
    },
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Create storage with key prefix
 */
export function createPrefixedStorage(storage: StorageAdapter, prefix: string): StorageAdapter {
  const prefixKey = (key: string) => `${prefix}:${key}`

  return {
    getItem: (key: string) => storage.getItem(prefixKey(key)),
    setItem: (key: string, value: string) => storage.setItem(prefixKey(key), value),
    removeItem: (key: string) => storage.removeItem(prefixKey(key)),
  }
}

/**
 * Closure-backed in-memory implementation of the DOM `Storage` shape. Used
 * by `useRoutePersistence` and `useChecklistPersistence` as the SSR / private-
 * browsing fallback when `window.localStorage` is unavailable.
 *
 * Returns the full DOM shape (including `length` and `key(index)`) because
 * existing call sites read those properties — promoted from the
 * `_data` cast hack in `useChecklistPersistence` and the closure version in
 * `useRoutePersistence`, deduplicated in Phase 1 of the refactor train.
 *
 * Each call returns an isolated store — instances do NOT share state.
 */
export function createMemoryStorage(): globalThis.Storage {
  const data: Record<string, string> = {}
  return {
    getItem(key: string): string | null {
      return data[key] ?? null
    },
    setItem(key: string, value: string): void {
      data[key] = value
    },
    removeItem(key: string): void {
      delete data[key]
    },
    clear(): void {
      for (const key of Object.keys(data)) {
        delete data[key]
      }
    },
    get length(): number {
      return Object.keys(data).length
    },
    key(index: number): string | null {
      return Object.keys(data)[index] ?? null
    },
  }
}
