// Alias the project's narrow 3-method `Storage` adapter type so it doesn't
// shadow the DOM `globalThis.Storage` shape used by `createMemoryStorage`.
import type { PersistenceConfig, Storage as StorageAdapter } from '../types'

/**
 * The SYNCHRONOUS three-method subset of the storage adapter.
 *
 * Core's `Storage` permits `Promise`-returning methods for async adapters;
 * several code paths cannot use those because they read `getItem` inline. Those
 * paths had each re-declared this shape locally — `@tour-kit/hints`'
 * persistence layer, and the option types in `@tour-kit/announcements` and
 * `@tour-kit/surveys`. One declaration, here, so `createPrefixedStorage` can
 * promise to hand a synchronous adapter back.
 *
 * `window.localStorage`, `createMemoryStorage()` and the in-memory test shims
 * all satisfy it structurally.
 */
export interface SyncStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

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
 * No-op storage for SSR.
 *
 * Typed `SyncStorage` rather than the wide `Storage`: every method here is
 * synchronous, and declaring it wide made it unusable as the stand-in for a
 * synchronous adapter — which is its whole purpose. Narrowing a return type is
 * safe for existing callers.
 */
export function createNoopStorage(): SyncStorage {
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
 * Create storage with key prefix.
 *
 * Overloaded rather than generic, because this is a pure pass-through:
 * `getItem` returns exactly what the inner `getItem` returned, so a caller
 * holding a SYNCHRONOUS adapter must get a synchronous one back. Returning the
 * wide `Storage` — which permits `Promise`-returning methods — forced every
 * synchronous consumer to re-narrow with an `as` cast; `@tour-kit/hints`'
 * persistence layer had one until the v3 Phase 1 review.
 *
 * NOT `<S extends Storage>(storage: S) => S`: that promises to return the
 * caller's exact type, which would oblige the wrapper to carry a DOM
 * `Storage`'s `length`, `key()` and `clear()` too — and spreading them copies
 * `length` as a number frozen at wrap time rather than a live getter. The
 * wrapper deliberately returns the three-method adapter and nothing else.
 */
export function createPrefixedStorage(storage: SyncStorage, prefix: string): SyncStorage
export function createPrefixedStorage(storage: StorageAdapter, prefix: string): StorageAdapter
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
