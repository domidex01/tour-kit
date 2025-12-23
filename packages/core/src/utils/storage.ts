import type { PersistenceConfig, Storage } from '../types'

/**
 * Create storage adapter from config
 */
export function createStorageAdapter(storageType: PersistenceConfig['storage']): Storage {
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
export function createNoopStorage(): Storage {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
}

/**
 * Cookie-based storage adapter
 */
export function createCookieStorage(options: { expires?: number; path?: string } = {}): Storage {
  const { expires = 365, path = '/' } = options

  return {
    getItem: (key: string) => {
      if (typeof document === 'undefined') return null
      const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`))
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
export function createPrefixedStorage(storage: Storage, prefix: string): Storage {
  const prefixKey = (key: string) => `${prefix}:${key}`

  return {
    getItem: (key: string) => storage.getItem(prefixKey(key)),
    setItem: (key: string, value: string) => storage.setItem(prefixKey(key), value),
    removeItem: (key: string) => storage.removeItem(prefixKey(key)),
  }
}
