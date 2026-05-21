import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCookieStorage,
  createMemoryStorage,
  createNoopStorage,
  createPrefixedStorage,
  createStorageAdapter,
  safeJSONParse,
} from '../../utils/storage'

describe('Storage Utilities', () => {
  describe('createNoopStorage', () => {
    it('returns null for getItem', () => {
      const storage = createNoopStorage()
      expect(storage.getItem('key')).toBeNull()
    })

    it('setItem does nothing', () => {
      const storage = createNoopStorage()
      expect(() => storage.setItem('key', 'value')).not.toThrow()
    })

    it('removeItem does nothing', () => {
      const storage = createNoopStorage()
      expect(() => storage.removeItem('key')).not.toThrow()
    })
  })

  describe('createStorageAdapter', () => {
    it('returns localStorage by default', () => {
      const storage = createStorageAdapter('localStorage')
      expect(storage).toBe(window.localStorage)
    })

    it('returns sessionStorage when specified', () => {
      const storage = createStorageAdapter('sessionStorage')
      expect(storage).toBe(window.sessionStorage)
    })

    it('returns custom storage when passed', () => {
      const customStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
      const storage = createStorageAdapter(customStorage)
      expect(storage).toBe(customStorage)
    })

    it('returns cookie storage when specified', () => {
      const storage = createStorageAdapter('cookie')
      expect(storage).toHaveProperty('getItem')
      expect(storage).toHaveProperty('setItem')
      expect(storage).toHaveProperty('removeItem')
    })
  })

  describe('safeJSONParse', () => {
    it('parses valid JSON', () => {
      expect(safeJSONParse('{"a":1}', {})).toEqual({ a: 1 })
    })

    it('parses valid array JSON', () => {
      expect(safeJSONParse('[1,2,3]', [])).toEqual([1, 2, 3])
    })

    it('returns fallback for null', () => {
      expect(safeJSONParse(null, { default: true })).toEqual({ default: true })
    })

    it('returns fallback for invalid JSON', () => {
      expect(safeJSONParse('invalid', [])).toEqual([])
    })

    it('returns fallback for empty string', () => {
      expect(safeJSONParse('', { fallback: true })).toEqual({ fallback: true })
    })
  })

  describe('createPrefixedStorage', () => {
    it('prefixes keys on getItem', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const prefixed = createPrefixedStorage(mockStorage, 'test')

      prefixed.getItem('key')
      expect(mockStorage.getItem).toHaveBeenCalledWith('test:key')
    })

    it('prefixes keys on setItem', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const prefixed = createPrefixedStorage(mockStorage, 'test')

      prefixed.setItem('key', 'value')
      expect(mockStorage.setItem).toHaveBeenCalledWith('test:key', 'value')
    })

    it('prefixes keys on removeItem', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const prefixed = createPrefixedStorage(mockStorage, 'test')

      prefixed.removeItem('key')
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test:key')
    })
  })

  describe('createCookieStorage', () => {
    beforeEach(() => {
      // Clear cookies before each test
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim()
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })

    it('sets and gets a cookie', () => {
      const storage = createCookieStorage()
      storage.setItem('test', 'value')
      expect(storage.getItem('test')).toBe('value')
    })

    it('returns null for non-existent cookie', () => {
      const storage = createCookieStorage()
      expect(storage.getItem('nonexistent')).toBeNull()
    })

    it('removes a cookie', () => {
      const storage = createCookieStorage()
      storage.setItem('toRemove', 'value')
      storage.removeItem('toRemove')
      expect(storage.getItem('toRemove')).toBeNull()
    })

    it('encodes and decodes values', () => {
      const storage = createCookieStorage()
      const value = 'test=value&special'
      storage.setItem('encoded', value)
      expect(storage.getItem('encoded')).toBe(value)
    })

    it('handles keys containing regex metacharacters (regression)', () => {
      const storage = createCookieStorage()
      // Typical prefixed tour key shape: `tourkit:feature.x.release-2`
      const key = 'tourkit:feature.x.release-2'
      storage.setItem(key, 'ok')
      expect(storage.getItem(key)).toBe('ok')

      // Also cover a broader set of metacharacters
      const keyWithMore = 'a+b*c?d(e)f[g]h{i}j|k^'
      storage.setItem(keyWithMore, 'also-ok')
      expect(storage.getItem(keyWithMore)).toBe('also-ok')
    })
  })

  describe('createMemoryStorage', () => {
    it('returns the full DOM Storage shape', () => {
      const storage = createMemoryStorage()
      expect(typeof storage.getItem).toBe('function')
      expect(typeof storage.setItem).toBe('function')
      expect(typeof storage.removeItem).toBe('function')
      expect(typeof storage.clear).toBe('function')
      expect(typeof storage.key).toBe('function')
      expect(typeof storage.length).toBe('number')
    })

    it('starts empty (length 0, key(0) null, getItem null)', () => {
      const storage = createMemoryStorage()
      expect(storage.length).toBe(0)
      expect(storage.key(0)).toBeNull()
      expect(storage.getItem('a')).toBeNull()
    })

    it('round-trips setItem / getItem and reflects length', () => {
      const storage = createMemoryStorage()
      storage.setItem('a', '1')
      expect(storage.getItem('a')).toBe('1')
      expect(storage.length).toBe(1)
      expect(storage.key(0)).toBe('a')

      storage.setItem('b', '2')
      expect(storage.length).toBe(2)
      expect(storage.key(1)).toBe('b')
    })

    it('overwrite preserves length (Storage.setItem replaces, does not append)', () => {
      const storage = createMemoryStorage()
      storage.setItem('a', '1')
      storage.setItem('a', '2')
      expect(storage.length).toBe(1)
      expect(storage.getItem('a')).toBe('2')
    })

    it('removeItem decrements length and getItem returns null', () => {
      const storage = createMemoryStorage()
      storage.setItem('a', '1')
      storage.setItem('b', '2')
      storage.removeItem('a')
      expect(storage.length).toBe(1)
      expect(storage.getItem('a')).toBeNull()
      expect(storage.key(0)).toBe('b')
    })

    it('clear() empties the store', () => {
      const storage = createMemoryStorage()
      storage.setItem('a', '1')
      storage.setItem('b', '2')
      storage.clear()
      expect(storage.length).toBe(0)
      expect(storage.key(0)).toBeNull()
      expect(storage.getItem('a')).toBeNull()
    })

    it('key(index) returns null for out-of-range index', () => {
      const storage = createMemoryStorage()
      storage.setItem('a', '1')
      expect(storage.key(5)).toBeNull()
    })

    it('two instances are isolated (no shared state)', () => {
      const s1 = createMemoryStorage()
      const s2 = createMemoryStorage()
      s1.setItem('shared', 'one')
      s2.setItem('shared', 'two')
      expect(s1.getItem('shared')).toBe('one')
      expect(s2.getItem('shared')).toBe('two')
      expect(s1.length).toBe(1)
      expect(s2.length).toBe(1)
    })
  })
})
