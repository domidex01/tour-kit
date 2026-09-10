/**
 * v3 Phase 3 Task 3.2 — the storage-key helpers, now React-free leaves.
 */
import { describe, expect, it } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import { STORAGE_KEY_PREFIX, getStorageKey } from '../persistence'

describe('storage keys', () => {
  it('namespaces per announcement id under the package prefix', () => {
    expect(STORAGE_KEY_PREFIX).toBe('tour-kit:announcements:')
    expect(getStorageKey(STORAGE_KEY_PREFIX, 'welcome')).toBe('tour-kit:announcements:welcome')
  })

  it('honours a caller-supplied prefix, so two providers can share a Storage', () => {
    expect(getStorageKey('app-a:', 'x')).toBe('app-a:x')
    expect(getStorageKey('app-b:', 'x')).toBe('app-b:x')
    // The point of the parameter: same id, different key, no collision.
    expect(getStorageKey('app-a:', 'x')).not.toBe(getStorageKey('app-b:', 'x'))
  })

  it('an empty id still yields a key inside the namespace', () => {
    expect(getStorageKey(STORAGE_KEY_PREFIX, '')).toBe(STORAGE_KEY_PREFIX)
  })
})

describe('createFakeStorage', () => {
  it('is a real Storage — key() and length included, which the ambient mock omits', () => {
    const s = createFakeStorage({ a: '1' })
    expect(s.length).toBe(1)
    expect(s.key(0)).toBe('a')
    expect(s.key(9)).toBeNull()
    s.setItem('b', '2')
    expect(s.snapshot()).toEqual({ a: '1', b: '2' })
    s.removeItem('a')
    expect(s.getItem('a')).toBeNull()
    s.clear()
    expect(s.length).toBe(0)
  })
})
