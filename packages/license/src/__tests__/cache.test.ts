import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCache, readCache, writeCache } from '../lib/cache'
import type { LicenseState } from '../types'
import { createMockLocalStorage } from './helpers'

const VALID_STATE: LicenseState = {
  status: 'valid',
  activation: {
    id: 'act_test_789',
    licenseKeyId: 'lk_test_123',
    label: 'example.com',
    createdAt: '2026-03-01T00:00:00Z',
    modifiedAt: '2026-03-01T00:00:00Z',
  },
  expiresAt: null,
}

let mockStorage: ReturnType<typeof createMockLocalStorage>

beforeEach(() => {
  mockStorage = createMockLocalStorage()
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('localStorage', mockStorage)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('writeCache + readCache round-trip', () => {
  it('round-trip preserves valid state', () => {
    writeCache('example.com', VALID_STATE)
    const result = readCache('example.com')
    expect(result).toEqual(VALID_STATE)
  })

  it('different domains are isolated', () => {
    const stateA: LicenseState = { ...VALID_STATE }
    const stateB: LicenseState = { status: 'revoked' }
    writeCache('a.com', stateA)
    writeCache('b.com', stateB)
    expect(readCache('a.com')).toEqual(stateA)
    expect(readCache('b.com')).toEqual(stateB)
  })
})

describe('readCache TTL', () => {
  it('returns cached state within TTL', () => {
    writeCache('example.com', VALID_STATE)
    const result = readCache('example.com')
    expect(result).toEqual(VALID_STATE)
  })

  it('returns null for expired entry (TTL exceeded)', () => {
    // Write cache entry with cachedAt 25 hours ago (exceeds 72h? No, 25h < 72h)
    // Use 73 hours ago to exceed 72h TTL
    const expiredEntry = {
      state: VALID_STATE,
      cachedAt: Date.now() - 73 * 60 * 60 * 1000,
      domain: 'example.com',
    }
    mockStorage.setItem('tourkit:license:example.com', JSON.stringify(expiredEntry))
    expect(readCache('example.com')).toBeNull()
  })

  it('clears expired entry from storage', () => {
    const expiredEntry = {
      state: VALID_STATE,
      cachedAt: Date.now() - 73 * 60 * 60 * 1000,
      domain: 'example.com',
    }
    mockStorage.setItem('tourkit:license:example.com', JSON.stringify(expiredEntry))
    readCache('example.com')
    expect(mockStorage.removeItem).toHaveBeenCalledWith('tourkit:license:example.com')
  })
})

describe('readCache integrity', () => {
  it('returns null and clears entry for corrupted JSON', () => {
    mockStorage.setItem('tourkit:license:example.com', 'not{valid json')
    expect(readCache('example.com')).toBeNull()
    expect(mockStorage.removeItem).toHaveBeenCalledWith('tourkit:license:example.com')
  })

  it('returns null and clears entry for wrong shape (Zod failure)', () => {
    mockStorage.setItem('tourkit:license:example.com', JSON.stringify({ wrong: 'shape' }))
    expect(readCache('example.com')).toBeNull()
    expect(mockStorage.removeItem).toHaveBeenCalledWith('tourkit:license:example.com')
  })

  it('returns null and clears entry for missing required fields', () => {
    mockStorage.setItem(
      'tourkit:license:example.com',
      JSON.stringify({ state: VALID_STATE, domain: 'example.com' })
    )
    expect(readCache('example.com')).toBeNull()
    expect(mockStorage.removeItem).toHaveBeenCalledWith('tourkit:license:example.com')
  })
})

describe('clearCache', () => {
  it('removes the correct key', () => {
    clearCache('example.com')
    expect(mockStorage.removeItem).toHaveBeenCalledWith('tourkit:license:example.com')
  })

  it('does not affect other domains', () => {
    writeCache('a.com', VALID_STATE)
    writeCache('b.com', VALID_STATE)
    clearCache('a.com')
    expect(readCache('b.com')).toEqual(VALID_STATE)
  })
})

describe('SSR safety', () => {
  it('readCache returns null when window is undefined', () => {
    vi.stubGlobal('window', undefined)
    expect(readCache('example.com')).toBeNull()
  })

  it('writeCache is a no-op when window is undefined', () => {
    vi.stubGlobal('window', undefined)
    expect(() => writeCache('example.com', VALID_STATE)).not.toThrow()
  })

  it('clearCache is a no-op when window is undefined', () => {
    vi.stubGlobal('window', undefined)
    expect(() => clearCache('example.com')).not.toThrow()
  })
})
