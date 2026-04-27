import type { LicenseCache, LicenseState } from '../types'
import { LicenseCacheSchema } from './schemas'

const CACHE_PREFIX = 'tourkit:license:'
const CACHE_TTL_MS = 72 * 60 * 60 * 1000 // 72 hours

// Deterministic short hash. Not a security primitive — used only to bind a
// cache entry to the license key it was issued for, so switching `licenseKey`
// in <LicenseProvider> does not return another key's cached state.
function hashKey(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export function readCache(domain: string, key?: string): LicenseState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${domain}`)
    if (!raw) return null
    const json: unknown = JSON.parse(raw)
    const parsed = LicenseCacheSchema.safeParse(json)
    if (!parsed.success) {
      clearCache(domain)
      return null
    }
    if (Date.now() - parsed.data.cachedAt > CACHE_TTL_MS) {
      clearCache(domain)
      return null
    }
    if (
      key !== undefined &&
      parsed.data.keyHash !== undefined &&
      parsed.data.keyHash !== hashKey(key)
    ) {
      clearCache(domain)
      return null
    }
    return parsed.data.state as LicenseState
  } catch {
    clearCache(domain)
    return null
  }
}

export function writeCache(domain: string, state: LicenseState, key?: string): void {
  if (typeof window === 'undefined') return
  try {
    const entry: LicenseCache = {
      state,
      cachedAt: Date.now(),
      domain,
      ...(key !== undefined ? { keyHash: hashKey(key) } : {}),
    }
    localStorage.setItem(`${CACHE_PREFIX}${domain}`, JSON.stringify(entry))
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

export function clearCache(domain: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${CACHE_PREFIX}${domain}`)
}

/**
 * Returns true if a non-expired, valid cache entry exists for this domain.
 * Pass `key` to also require the cached entry's keyHash to match the current
 * license key. Used by error-state handling: error + fresh cache = grace
 * period (licensed), error + no cache = unlicensed.
 */
export function hasFreshCache(domain: string, key?: string): boolean {
  return readCache(domain, key) !== null
}
