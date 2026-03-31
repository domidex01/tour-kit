import type { LicenseCache, LicenseState } from '../types'
import { LicenseCacheSchema } from './schemas'

const CACHE_PREFIX = 'tourkit:license:'
const CACHE_TTL_MS = 72 * 60 * 60 * 1000 // 72 hours

export function readCache(domain: string): LicenseState | null {
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
    return parsed.data.state as LicenseState
  } catch {
    clearCache(domain)
    return null
  }
}

export function writeCache(domain: string, state: LicenseState): void {
  if (typeof window === 'undefined') return
  try {
    const entry: LicenseCache = { state, cachedAt: Date.now(), domain }
    localStorage.setItem(`${CACHE_PREFIX}${domain}`, JSON.stringify(entry))
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

export function clearCache(domain: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${CACHE_PREFIX}${domain}`)
}
