# Phase 1 — Core License SDK

**Duration:** Days 3–6 (~10 hours)
**Depends on:** Phase 0 (Polar API validated, sandbox credentials available)
**Blocks:** Phase 2 (React Integration), Phase 4 (Webhook + Pricing Page)
**Risk Level:** MEDIUM — standard library code but depends on correct Polar API modeling
**Stack:** typescript

---

## 1. Objective + What Success Looks Like

Replace the existing JWT-based license validation in `packages/license/` with a Polar.sh-backed license key system. This phase builds the framework-agnostic layer only — no React components, no providers, no hooks. The output is a set of pure TypeScript modules that validate, activate, cache, and detect domains.

**Success looks like:**

1. `validateLicenseKey('TOURKIT_abc123', { organizationId: 'org_xxx' })` returns `{ status: 'valid', tier: 'pro' }` for a granted key, `{ status: 'invalid', error: 'revoked' }` for a revoked key, and `{ status: 'invalid', error: 'key_not_found' }` for a nonexistent key
2. A second call to `validateLicenseKey()` within 24 hours returns the cached result without hitting the Polar API (verified via mock fetch call count)
3. After 24 hours, the cache expires and `validateLicenseKey()` re-validates against Polar
4. `isDevEnvironment()` returns `true` for `localhost`, `127.0.0.1`, `0.0.0.0`, any `*.local`, and any `*.test` hostname
5. `getCurrentDomain()` returns `window.location.hostname` in browser, `null` in SSR
6. `jose` is removed from `package.json` and `node_modules` — no JWT code exists anywhere in the package
7. `import { validateLicenseKey, isDevEnvironment, getCurrentDomain } from '@tour-kit/license/headless'` works and exports only non-React code
8. All 3 test files (`polar-client.test.ts`, `cache.test.ts`, `domain.test.ts`) pass with >80% line coverage of `src/lib/`

---

## 2. Architecture / Key Design Decisions

### Data Flow

```
validateLicenseKey(key, options)
        │
        ▼
  ┌─────────────┐
  │ readCache()  │──── hit + fresh ────► return cached LicenseState
  └─────┬───────┘
        │ miss or stale
        ▼
  ┌─────────────────┐
  │ validateKey()    │──── POST /v1/customer-portal/license-keys/validate
  └─────┬───────────┘
        │
        ▼
  ┌──────────────────────┐
  │ status === 'granted' │
  │ && no activation     │──── yes ────► activateKey() with domain label
  │ for this domain?     │              POST /v1/customer-portal/license-keys/activate
  └─────┬────────────────┘
        │
        ▼
  ┌──────────────┐
  │ writeCache() │──── store LicenseState with 24h TTL, domain-scoped key
  └──────┬───────┘
        │
        ▼
    return LicenseState
```

### Key Design Decisions

**D1: Discriminated union for `LicenseState`, not a boolean `valid` field.**
The old code uses `{ valid: boolean, payload, error }` which requires null checks everywhere. The new code uses a discriminated union on `status: 'valid' | 'invalid' | 'loading' | 'unchecked'` so consumers can exhaustively switch and TypeScript narrows the type automatically.

**D2: Zod for Polar API response validation, interfaces for internal types.**
Polar API responses are external untrusted data — Zod schemas validate the shape at the boundary. Internal types (`LicenseState`, `LicenseCache`) are plain TypeScript interfaces/types — no runtime overhead.

**D3: Raw `fetch()` — no `@polar-sh/sdk` dependency.**
We only call 3 endpoints. Raw fetch keeps the bundle at ~200 lines. The SDK would add unnecessary weight and coupling.

**D4: Domain-scoped localStorage keys with 24h TTL.**
Cache key format: `tourkit_license_{domain}` (e.g., `tourkit_license_myapp.com`). This ensures one site's cached result does not leak to another domain on the same machine (dev scenarios with multiple projects). TTL is stored as `expiresAt` timestamp inside the cached object.

**D5: Auto-activate on first domain encounter.**
When `validateKey()` returns `status: 'granted'` but no activation exists for the current domain, `activateKey()` is called automatically. This avoids a separate manual activation step. If activation fails (403 — limit reached), the license is still considered valid (already granted), but a warning is surfaced.

**D6: Dev environment bypasses activation, not validation.**
In dev (localhost, etc.), `validateLicenseKey()` still calls the Polar API to validate the key, but skips `activateKey()` so dev environments never consume an activation slot.

### Data Model Strategy

| Concern | Approach | Type |
|---------|----------|------|
| License validation state | Discriminated union | `type LicenseState` |
| Polar validate response | Zod schema + inferred type | `PolarValidateResponseSchema` → `PolarValidateResponse` |
| Polar activate response | Zod schema + inferred type | `PolarActivateResponseSchema` → `PolarActivateResponse` |
| Cached license data | Interface with TTL field | `interface LicenseCache` |
| Error classification | String literal union | `type LicenseErrorCode` |
| Validation options | Interface | `interface ValidateLicenseOptions` |
| Polar API status | Literal union extracted from Polar docs | `'granted' \| 'revoked' \| 'disabled'` |

---

## 3. Tasks

### Task 1.1 — Define TypeScript Types (1.5h)

**File:** `packages/license/src/types/index.ts`

Replace the entire contents with new Polar-based types. Delete the old JWT types (`LicensePayload`, `LicensePackage`, `LicenseFeature`, `LicenseLimits`, `LicenseValidation`). Keep `LicenseTier` and `LicenseError` (renamed to `LicenseErrorCode`), update `LicenseContextValue`, `LicenseProviderProps`, `LicenseGateProps`, `LicenseWarningProps`.

**New types to define:**

```typescript
// ── License tier (unchanged) ──
export type LicenseTier = 'free' | 'pro'

// ── Polar key status (from Polar API docs) ──
export type PolarKeyStatus = 'granted' | 'revoked' | 'disabled'

// ── Error codes (replaces old LicenseError) ──
export type LicenseErrorCode =
  | 'key_not_found'
  | 'key_revoked'
  | 'key_disabled'
  | 'key_expired'
  | 'activation_limit_reached'
  | 'network_error'
  | 'validation_error'
  | 'cache_corrupted'

// ── Discriminated union for license state ──
export type LicenseState =
  | { status: 'valid'; tier: LicenseTier; activationId: string | null; expiresAt: string | null; customerId: string }
  | { status: 'invalid'; error: LicenseErrorCode; message?: string }
  | { status: 'loading' }
  | { status: 'unchecked' }

// ── Cache entry ──
export interface LicenseCache {
  state: Extract<LicenseState, { status: 'valid' | 'invalid' }>
  domain: string
  cachedAt: number      // Date.now() timestamp
  expiresAt: number     // cachedAt + 24h
  keyHash: string       // SHA-256 hash of the key (for cache invalidation if key changes)
}

// ── Options for the public orchestrator ──
export interface ValidateLicenseOptions {
  organizationId: string
  /** Override domain detection (useful for testing) */
  domain?: string
  /** Skip cache and force re-validation */
  forceRefresh?: boolean
  /** Skip activation even for new domains (default: false) */
  skipActivation?: boolean
}

// ── Polar API response shapes (TypeScript types — Zod schemas in schemas.ts) ──

export interface PolarCustomer {
  id: string
  email: string
}

export interface PolarActivation {
  id: string
  label: string
  meta: Record<string, string>
}

export interface PolarValidateResponse {
  id: string
  key: string
  display_key: string
  status: PolarKeyStatus
  limit_activations: number | null
  usage: number
  limit_usage: number | null
  validations: number
  expires_at: string | null
  activation: PolarActivation | null
  customer: PolarCustomer
}

export interface PolarActivateResponse {
  id: string
  license_key_id: string
  label: string
  meta: Record<string, string>
}
```

**Types to delete:** `LicensePayload`, `LicensePackage`, `LicenseFeature`, `LicenseLimits`, `LicenseValidation` (the old JWT-era types).

**Types to keep and update for Phase 2 (leave stubs now):** `LicenseContextValue`, `LicenseProviderProps`, `LicenseGateProps`, `LicenseWarningProps` — update `LicenseProviderProps` to use `organizationId: string` instead of `publicKey: string`. These are React types used in Phase 2; define them now so `index.ts` exports compile, but they will be fully wired in Phase 2.

**Sanity check:** After this task, `pnpm --filter @tour-kit/license typecheck` should pass (expect failures in `utils/validate.ts` which is deleted in Task 1.7 — that's fine, typecheck fully passes after Task 1.7).

---

### Task 1.2 — Write Zod Schemas for Polar API Responses (1h)

**File:** `packages/license/src/lib/schemas.ts` (NEW)

Add `zod` as a dependency to `packages/license/package.json`.

```typescript
import { z } from 'zod'

// ── Polar validate response schema ──

const PolarCustomerSchema = z.object({
  id: z.string(),
  email: z.string(),
})

const PolarActivationSchema = z.object({
  id: z.string(),
  label: z.string(),
  meta: z.record(z.string(), z.string()),
})

export const PolarValidateResponseSchema = z.object({
  id: z.string(),
  key: z.string(),
  display_key: z.string(),
  status: z.enum(['granted', 'revoked', 'disabled']),
  limit_activations: z.number().nullable(),
  usage: z.number(),
  limit_usage: z.number().nullable(),
  validations: z.number(),
  expires_at: z.string().nullable(),
  activation: PolarActivationSchema.nullable(),
  customer: PolarCustomerSchema,
})

// ── Polar activate response schema ──

export const PolarActivateResponseSchema = z.object({
  id: z.string(),
  license_key_id: z.string(),
  label: z.string(),
  meta: z.record(z.string(), z.string()),
})

// Inferred types (should match interfaces in types/index.ts)
export type PolarValidateResponseParsed = z.infer<typeof PolarValidateResponseSchema>
export type PolarActivateResponseParsed = z.infer<typeof PolarActivateResponseSchema>
```

**Sanity check:** The Zod-inferred types should be structurally identical to the `PolarValidateResponse` and `PolarActivateResponse` interfaces defined in Task 1.1. A quick `satisfies` check in tests will confirm.

---

### Task 1.3 — Implement `polar-client.ts` (1.5h)

**File:** `packages/license/src/lib/polar-client.ts` (NEW)

Three functions wrapping the Polar customer-portal endpoints. All use raw `fetch()`.

```typescript
const POLAR_BASE_URL = 'https://api.polar.sh/v1/customer-portal/license-keys'

// ── validateKey ──
export async function validateKey(
  key: string,
  organizationId: string
): Promise<PolarValidateResponse> {
  const res = await fetch(`${POLAR_BASE_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: organizationId }),
  })
  if (!res.ok) {
    // 404 = key not found, other errors = network/server issues
    if (res.status === 404) throw new PolarApiError('key_not_found', 'License key not found')
    throw new PolarApiError('network_error', `Polar API error: ${res.status}`)
  }
  const data = await res.json()
  return PolarValidateResponseSchema.parse(data)
}

// ── activateKey ──
export async function activateKey(
  key: string,
  organizationId: string,
  label: string
): Promise<PolarActivateResponse> {
  const res = await fetch(`${POLAR_BASE_URL}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: organizationId, label }),
  })
  if (!res.ok) {
    if (res.status === 403) throw new PolarApiError('activation_limit_reached', 'Activation limit reached')
    throw new PolarApiError('network_error', `Polar API error: ${res.status}`)
  }
  const data = await res.json()
  return PolarActivateResponseSchema.parse(data)
}

// ── deactivateKey ──
export async function deactivateKey(
  key: string,
  organizationId: string,
  activationId: string
): Promise<void> {
  const res = await fetch(`${POLAR_BASE_URL}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: organizationId, activation_id: activationId }),
  })
  if (!res.ok) {
    throw new PolarApiError('network_error', `Polar API error: ${res.status}`)
  }
  // 204 No Content — success
}
```

Also define a custom error class:

```typescript
export class PolarApiError extends Error {
  constructor(
    public readonly code: LicenseErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'PolarApiError'
  }
}
```

**Sanity check:** Mock `globalThis.fetch` in tests, call `validateKey()` with a mock 200 response, and verify the return value matches `PolarValidateResponse`.

---

### Task 1.4 — Implement `cache.ts` (1h)

**File:** `packages/license/src/lib/cache.ts` (NEW)

localStorage-based cache with 24h TTL and domain-scoped keys.

```typescript
const CACHE_PREFIX = 'tourkit_license_'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(domain: string): string {
  return `${CACHE_PREFIX}${domain}`
}

export function readCache(domain: string): LicenseCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getCacheKey(domain))
    if (!raw) return null
    const parsed: LicenseCache = JSON.parse(raw)
    // Check TTL
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(getCacheKey(domain))
      return null
    }
    return parsed
  } catch {
    // Corrupted cache — clear it
    clearCache(domain)
    return null
  }
}

export function writeCache(domain: string, state: LicenseCache['state'], keyHash: string): void {
  if (typeof window === 'undefined') return
  const now = Date.now()
  const entry: LicenseCache = {
    state,
    domain,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
    keyHash,
  }
  try {
    localStorage.setItem(getCacheKey(domain), JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

export function clearCache(domain: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(getCacheKey(domain))
  } catch {
    // silent fail
  }
}
```

**Key hash strategy:** Use a simple hash of the license key so that if the user changes their key, the stale cache for the old key is automatically invalidated. Implement as:

```typescript
export async function hashKey(key: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(key)
    const buffer = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback: simple string hash for environments without crypto.subtle
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}
```

**Sanity check:** In tests, mock `localStorage` (vitest `jsdom` environment provides this). Write a cache entry, read it back, verify fields. Advance time past 24h (use `vi.setSystemTime()`), read again, verify `null`.

---

### Task 1.5 — Implement `domain.ts` (0.5h)

**File:** `packages/license/src/lib/domain.ts` (NEW)

```typescript
const DEV_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
])

const DEV_TLDS = ['.local', '.test']

export function getCurrentDomain(): string | null {
  if (typeof window === 'undefined') return null
  return window.location.hostname
}

export function isDevEnvironment(domain?: string | null): boolean {
  const hostname = domain ?? getCurrentDomain()
  if (!hostname) return false
  if (DEV_HOSTNAMES.has(hostname)) return true
  return DEV_TLDS.some(tld => hostname.endsWith(tld))
}
```

**Sanity check:** `isDevEnvironment('localhost')` → `true`, `isDevEnvironment('myapp.local')` → `true`, `isDevEnvironment('myapp.com')` → `false`, `isDevEnvironment('127.0.0.1')` → `true`, `isDevEnvironment(null)` → `false`.

---

### Task 1.6 — Implement `validateLicenseKey()` Orchestrator (1.5h)

**File:** `packages/license/src/lib/polar-client.ts` (extend — add the orchestrator in the same file, or create a separate `packages/license/src/lib/validate-license.ts` if preferred for clarity)

Recommended: create `packages/license/src/lib/validate-license.ts` to keep the orchestration logic separate from the raw API calls.

```typescript
import { validateKey, activateKey, PolarApiError } from './polar-client'
import { readCache, writeCache, hashKey, clearCache } from './cache'
import { getCurrentDomain, isDevEnvironment } from './domain'
import type { LicenseState, ValidateLicenseOptions } from '../types'

export async function validateLicenseKey(
  key: string,
  options: ValidateLicenseOptions
): Promise<Extract<LicenseState, { status: 'valid' | 'invalid' }>> {
  const { organizationId, forceRefresh = false, skipActivation = false } = options
  const domain = options.domain ?? getCurrentDomain() ?? 'unknown'
  const keyHashValue = await hashKey(key)

  // 1. Check cache (unless force refresh)
  if (!forceRefresh) {
    const cached = readCache(domain)
    if (cached && cached.keyHash === keyHashValue) {
      return cached.state
    }
  }

  try {
    // 2. Validate with Polar
    const response = await validateKey(key, organizationId)

    // 3. Map Polar status to LicenseState
    if (response.status === 'revoked') {
      const state = { status: 'invalid' as const, error: 'key_revoked' as const }
      writeCache(domain, state, keyHashValue)
      return state
    }

    if (response.status === 'disabled') {
      const state = { status: 'invalid' as const, error: 'key_disabled' as const }
      writeCache(domain, state, keyHashValue)
      return state
    }

    // Check expiry
    if (response.expires_at && new Date(response.expires_at) < new Date()) {
      const state = { status: 'invalid' as const, error: 'key_expired' as const }
      writeCache(domain, state, keyHashValue)
      return state
    }

    // 4. status === 'granted' — attempt activation if needed
    let activationId = response.activation?.id ?? null

    if (!activationId && !skipActivation && !isDevEnvironment(domain)) {
      try {
        const activation = await activateKey(key, organizationId, domain)
        activationId = activation.id
      } catch (err) {
        if (err instanceof PolarApiError && err.code === 'activation_limit_reached') {
          // Key is valid but can't activate on this domain
          // Still return valid — the key IS granted, just can't add more domains
          console.warn('[tour-kit/license] Activation limit reached. Key is valid but this domain is not activated.')
        } else {
          throw err
        }
      }
    }

    const state: Extract<LicenseState, { status: 'valid' }> = {
      status: 'valid',
      tier: 'pro',
      activationId,
      expiresAt: response.expires_at,
      customerId: response.customer.id,
    }
    writeCache(domain, state, keyHashValue)
    return state

  } catch (err) {
    if (err instanceof PolarApiError) {
      const state = { status: 'invalid' as const, error: err.code, message: err.message }
      // Only cache definitive errors, not network errors
      if (err.code !== 'network_error') {
        writeCache(domain, state, keyHashValue)
      }
      return state
    }
    return { status: 'invalid', error: 'network_error', message: String(err) }
  }
}
```

**Orchestration rules:**
1. Cache hit with matching key hash and within TTL → return cached state (no network call)
2. Cache miss → call `validateKey()`
3. If `status: 'granted'` and no existing activation for this domain → call `activateKey()` (unless dev environment or `skipActivation`)
4. Write result to cache
5. Network errors are NOT cached (so the next call retries)
6. Definitive errors (revoked, disabled, expired, not found) ARE cached

**Sanity check:** Mock fetch to return `{ status: 'granted', ... }`, call `validateLicenseKey()` twice. First call should invoke fetch once (validate) + once (activate) = 2 calls. Second call should invoke fetch 0 times (cache hit).

---

### Task 1.7 — Remove `jose` Dependency and Old JWT Code (0.5h)

**Steps:**

1. Delete `packages/license/src/utils/validate.ts` entirely
2. Delete the `packages/license/src/utils/` directory if empty
3. Remove `"jose": "^5.9.0"` from `dependencies` in `packages/license/package.json`
4. Add `"zod": "^3.23.0"` to `dependencies` in `packages/license/package.json` (needed for Task 1.2)
5. Update `packages/license/src/index.ts` to remove the old JWT exports (`validateLicense`, `validateDomain`, `getCurrentDomain` from `./utils/validate`)
6. Run `pnpm install` to update the lockfile
7. Verify: `grep -r "jose" packages/license/` returns zero results
8. Verify: `grep -r "jwt\|JWT" packages/license/src/` returns zero results (except comments about migration if any)

**Sanity check:** `pnpm --filter @tour-kit/license build` succeeds. `pnpm --filter @tour-kit/license typecheck` passes.

---

### Task 1.8 — Write Unit Tests (2h)

**File:** `packages/license/src/__tests__/polar-client.test.ts`

Test coverage targets for `src/lib/polar-client.ts`:

| Test Case | Expected |
|-----------|----------|
| `validateKey()` with 200 response | Returns parsed `PolarValidateResponse` |
| `validateKey()` with 404 response | Throws `PolarApiError` with code `key_not_found` |
| `validateKey()` with 500 response | Throws `PolarApiError` with code `network_error` |
| `validateKey()` with malformed JSON | Throws Zod validation error |
| `activateKey()` with 200 response | Returns parsed `PolarActivateResponse` |
| `activateKey()` with 403 response | Throws `PolarApiError` with code `activation_limit_reached` |
| `deactivateKey()` with 204 response | Resolves without error |
| `deactivateKey()` with 500 response | Throws `PolarApiError` |

Mock strategy: `vi.stubGlobal('fetch', vi.fn())` — return `Response` objects with appropriate status codes and JSON bodies.

**File:** `packages/license/src/__tests__/cache.test.ts`

Test coverage targets for `src/lib/cache.ts`:

| Test Case | Expected |
|-----------|----------|
| `writeCache()` then `readCache()` | Returns the cached state |
| `readCache()` with no entry | Returns `null` |
| `readCache()` after TTL expires | Returns `null`, removes the entry |
| `writeCache()` then `clearCache()` then `readCache()` | Returns `null` |
| `readCache()` with corrupted JSON | Returns `null`, clears the entry |
| `readCache()` in SSR (`window === undefined`) | Returns `null` |
| `hashKey()` produces consistent output | Same key → same hash |
| `hashKey()` produces different output for different keys | Different keys → different hashes |
| Cache respects domain scoping | Write to domain A, read from domain B → `null` |

Mock strategy: vitest `jsdom` environment provides `localStorage`. Use `vi.setSystemTime()` to test TTL expiry.

**File:** `packages/license/src/__tests__/domain.test.ts`

Test coverage targets for `src/lib/domain.ts`:

| Test Case | Expected |
|-----------|----------|
| `isDevEnvironment('localhost')` | `true` |
| `isDevEnvironment('127.0.0.1')` | `true` |
| `isDevEnvironment('0.0.0.0')` | `true` |
| `isDevEnvironment('::1')` | `true` |
| `isDevEnvironment('myapp.local')` | `true` |
| `isDevEnvironment('staging.test')` | `true` |
| `isDevEnvironment('myapp.com')` | `false` |
| `isDevEnvironment('localhost.com')` | `false` |
| `isDevEnvironment(null)` | `false` |
| `isDevEnvironment(undefined)` | `false` |
| `getCurrentDomain()` in SSR | `null` |
| `getCurrentDomain()` in browser | `window.location.hostname` |

Mock strategy: Pass domain as argument for `isDevEnvironment()` tests. For `getCurrentDomain()`, test SSR by checking `typeof window`.

**Verification:** `pnpm --filter @tour-kit/license test:coverage` reports >80% line coverage for `src/lib/polar-client.ts`, `src/lib/cache.ts`, `src/lib/domain.ts`.

---

### Task 1.9 — Update `headless.ts` Exports (0.5h)

**File:** `packages/license/src/headless.ts` (NEW — replaces the React-only `index.ts` as the headless entry point)

```typescript
// Types
export type {
  LicenseTier,
  LicenseState,
  LicenseCache,
  LicenseErrorCode,
  ValidateLicenseOptions,
  PolarValidateResponse,
  PolarActivateResponse,
  PolarKeyStatus,
  PolarCustomer,
  PolarActivation,
} from './types'

// Validation orchestrator
export { validateLicenseKey } from './lib/validate-license'

// Low-level API (for advanced usage)
export { validateKey, activateKey, deactivateKey, PolarApiError } from './lib/polar-client'

// Cache management
export { readCache, writeCache, clearCache, hashKey } from './lib/cache'

// Domain detection
export { getCurrentDomain, isDevEnvironment } from './lib/domain'
```

Also update `packages/license/tsup.config.ts` to include `headless.ts` as an entry point (if not already configured). Update `package.json` exports map to add:

```json
"./headless": {
  "import": {
    "types": "./dist/headless.d.ts",
    "default": "./dist/headless.js"
  },
  "require": {
    "types": "./dist/headless.d.cts",
    "default": "./dist/headless.cjs"
  }
}
```

Update `src/index.ts` to re-export everything from `headless.ts` plus the React types (which will be wired in Phase 2):

```typescript
'use client'

// Re-export all headless functionality
export * from './headless'

// React types (components wired in Phase 2)
export type {
  LicenseContextValue,
  LicenseProviderProps,
  LicenseGateProps,
  LicenseWarningProps,
} from './types'
```

**Sanity check:** `pnpm --filter @tour-kit/license build` succeeds and produces both `dist/index.js` and `dist/headless.js`.

---

## 4. Deliverables

```
packages/license/
├── src/
│   ├── types/
│   │   └── index.ts               # Task 1.1 — REWRITE (Polar-based types, discriminated unions)
│   ├── lib/
│   │   ├── schemas.ts             # Task 1.2 — NEW (Zod schemas for Polar API responses)
│   │   ├── polar-client.ts        # Task 1.3 — NEW (validateKey, activateKey, deactivateKey)
│   │   ├── cache.ts               # Task 1.4 — NEW (localStorage cache with 24h TTL)
│   │   ├── domain.ts              # Task 1.5 — NEW (getCurrentDomain, isDevEnvironment)
│   │   └── validate-license.ts    # Task 1.6 — NEW (public orchestrator)
│   ├── headless.ts                # Task 1.9 — NEW (non-React exports)
│   ├── index.ts                   # Task 1.9 — UPDATE (re-exports headless + React type stubs)
│   └── __tests__/
│       ├── polar-client.test.ts   # Task 1.8 — NEW
│       ├── cache.test.ts          # Task 1.8 — NEW
│       └── domain.test.ts         # Task 1.8 — NEW
├── package.json                   # Task 1.7 — UPDATE (remove jose, add zod)
└── tsup.config.ts                 # Task 1.9 — UPDATE (add headless entry)

DELETED:
├── src/utils/validate.ts          # Task 1.7 — DELETE (old JWT code)
```

---

## 5. Exit Criteria

Each criterion maps 1:1 to a deliverable or task:

- [ ] `validateLicenseKey()` returns `{ status: 'valid', tier: 'pro' }` for a granted key (Task 1.6 + 1.8)
- [ ] `validateLicenseKey()` returns `{ status: 'invalid', error: 'key_revoked' }` for a revoked key (Task 1.6 + 1.8)
- [ ] `validateLicenseKey()` returns `{ status: 'invalid', error: 'key_not_found' }` for a nonexistent key (Task 1.6 + 1.8)
- [ ] Cache returns stored result within 24h TTL (Task 1.4 + 1.8)
- [ ] Cache returns `null` after TTL expires, triggering re-validation (Task 1.4 + 1.8)
- [ ] Cache is domain-scoped — different domains get different cache entries (Task 1.4 + 1.8)
- [ ] `isDevEnvironment()` returns `true` for `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local`, `*.test` (Task 1.5 + 1.8)
- [ ] `isDevEnvironment()` returns `false` for `myapp.com`, `localhost.com` (Task 1.5 + 1.8)
- [ ] `jose` removed from `package.json` — `grep -r "jose" packages/license/package.json` returns empty (Task 1.7)
- [ ] No JWT code remains — `grep -r "jwt\|JWT\|jwtVerify\|importSPKI" packages/license/src/` returns empty (Task 1.7)
- [ ] `zod` added to `dependencies` in `package.json` (Task 1.2 + 1.7)
- [ ] All 3 test files pass: `pnpm --filter @tour-kit/license test` exits 0 (Task 1.8)
- [ ] Test coverage >80% for `src/lib/`: `pnpm --filter @tour-kit/license test:coverage` (Task 1.8)
- [ ] `pnpm --filter @tour-kit/license build` produces both `dist/index.js` and `dist/headless.js` (Task 1.9)
- [ ] `pnpm --filter @tour-kit/license typecheck` passes with zero errors (all tasks)

---

## 6. Execution Prompt

> Paste this entire section into a fresh Claude Code session to implement Phase 1.

---

You are implementing **Phase 1 (Core License SDK)** for the Tour Kit Licensing System. Your goal is to replace the existing JWT-based license validation with Polar.sh-backed license key validation, activation, caching, and domain detection. This phase is framework-agnostic — no React components, providers, or hooks (those come in Phase 2).

### What is Tour Kit?

Tour Kit is a headless onboarding and product tour library for React, published as a monorepo of npm packages (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`, plus 7 extended packages). The `@tour-kit/license` package gates extended packages behind a Pro license. Currently it uses JWT + `jose` for validation. You are replacing that with Polar.sh license key API calls.

### What Phase 0 Established

Phase 0 confirmed that Polar's customer-portal license key API works. Three public endpoints (no auth required):

1. **Validate:** `POST https://api.polar.sh/v1/customer-portal/license-keys/validate`
   - Request: `{ "key": "TOURKIT_<uuid>", "organization_id": "org_xxx" }`
   - Response: `{ "id": "...", "key": "...", "display_key": "...", "status": "granted"|"revoked"|"disabled", "limit_activations": 5, "usage": 0, "limit_usage": null, "validations": 42, "expires_at": null, "activation": null, "customer": { "id": "...", "email": "..." } }`
   - Returns 404 for unknown keys.

2. **Activate:** `POST https://api.polar.sh/v1/customer-portal/license-keys/activate`
   - Request: `{ "key": "...", "organization_id": "...", "label": "myapp.com" }`
   - Response: `{ "id": "act_xxx", "license_key_id": "lk_xxx", "label": "myapp.com", "meta": {} }`
   - Returns 403 when activation limit reached.

3. **Deactivate:** `POST https://api.polar.sh/v1/customer-portal/license-keys/deactivate`
   - Request: `{ "key": "...", "organization_id": "...", "activation_id": "act_xxx" }`
   - Response: 204 No Content.

### Monorepo Context

- **Root:** `/mnt/c/Users/domi/Desktop/next-playground/tour-kit/`
- **License package:** `packages/license/`
- **Package manager:** pnpm (also supports bun)
- **Build tool:** tsup (ESM + CJS with TypeScript declarations)
- **Test framework:** vitest with jsdom environment
- **Current deps to remove:** `jose` (JWT library)
- **New deps to add:** `zod` (runtime validation for Polar API responses)

### Existing Code to Replace

The license package currently has:
- `src/types/index.ts` — JWT-era types (`LicensePayload`, `LicensePackage`, `LicenseFeature`, etc.)
- `src/utils/validate.ts` — JWT validation using `jose` (`validateLicense()`, `validateDomain()`, `getCurrentDomain()`)
- `src/index.ts` — re-exports types and utils (has `'use client'` directive)
- `src/context/`, `src/hooks/`, `src/components/` — React code (DO NOT TOUCH in this phase)

### Data Model Rules

1. **Discriminated unions for state machines.** `LicenseState` uses `status` as the discriminant:
   ```typescript
   type LicenseState =
     | { status: 'valid'; tier: LicenseTier; activationId: string | null; expiresAt: string | null; customerId: string }
     | { status: 'invalid'; error: LicenseErrorCode; message?: string }
     | { status: 'loading' }
     | { status: 'unchecked' }
   ```

2. **Zod for external data, interfaces for internal data.** Polar API responses are validated with Zod schemas at the fetch boundary. Internal types (`LicenseCache`, `ValidateLicenseOptions`) are plain interfaces.

3. **Domain-scoped cache keys.** localStorage key format: `tourkit_license_{domain}`. Cache entries include a key hash so changing the license key invalidates the cache.

4. **24h TTL on cache.** Stored as `expiresAt` timestamp (number). Expired entries are deleted on read.

5. **Dev environment detection.** `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local`, `*.test` are dev environments. Dev environments skip activation (never consume a slot) but still validate the key.

### Per-File Implementation Guide

#### 1. `src/types/index.ts` — REWRITE

Delete all JWT types (`LicensePayload`, `LicensePackage`, `LicenseFeature`, `LicenseLimits`, `LicenseValidation`). Define new types:
- `LicenseTier = 'free' | 'pro'`
- `PolarKeyStatus = 'granted' | 'revoked' | 'disabled'`
- `LicenseErrorCode` (string literal union: `key_not_found`, `key_revoked`, `key_disabled`, `key_expired`, `activation_limit_reached`, `network_error`, `validation_error`, `cache_corrupted`)
- `LicenseState` (discriminated union on `status`)
- `LicenseCache` (interface with `state`, `domain`, `cachedAt`, `expiresAt`, `keyHash`)
- `ValidateLicenseOptions` (interface with `organizationId`, optional `domain`, `forceRefresh`, `skipActivation`)
- `PolarCustomer`, `PolarActivation`, `PolarValidateResponse`, `PolarActivateResponse` (interfaces matching Polar API shapes)
- Keep `LicenseContextValue`, `LicenseProviderProps`, `LicenseGateProps`, `LicenseWarningProps` but update `LicenseProviderProps` to use `organizationId: string` instead of `publicKey: string`, and update `LicenseContextValue` to use `LicenseState` instead of `LicenseValidation`

#### 2. `src/lib/schemas.ts` — NEW

Zod schemas for `PolarValidateResponse` and `PolarActivateResponse`. Export the schemas and Zod-inferred types.

#### 3. `src/lib/polar-client.ts` — NEW

Three async functions: `validateKey()`, `activateKey()`, `deactivateKey()`. Each uses raw `fetch()` against the Polar endpoints listed above. Parse responses with Zod schemas from `schemas.ts`. Define `PolarApiError` class with a `code: LicenseErrorCode` property. Map HTTP status codes: 404 → `key_not_found`, 403 → `activation_limit_reached`, other non-OK → `network_error`.

#### 4. `src/lib/cache.ts` — NEW

Functions: `readCache(domain)`, `writeCache(domain, state, keyHash)`, `clearCache(domain)`, `hashKey(key)`. All are SSR-safe (return `null` / no-op when `typeof window === 'undefined'`). Use `crypto.subtle.digest('SHA-256', ...)` for `hashKey()` with a simple fallback for environments without `crypto.subtle`.

#### 5. `src/lib/domain.ts` — NEW

Functions: `getCurrentDomain()` (returns `window.location.hostname` or `null` in SSR), `isDevEnvironment(domain?)` (checks against `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local`, `*.test`).

#### 6. `src/lib/validate-license.ts` — NEW

The public orchestrator `validateLicenseKey(key, options)`. Flow: check cache → validate with Polar → auto-activate if needed → write cache → return `LicenseState`. Dev environments skip activation. Network errors are not cached. See Section 2 data flow diagram for the full logic.

#### 7. Delete `src/utils/validate.ts` and the `src/utils/` directory

#### 8. Update `package.json`

Remove `jose` from `dependencies`. Add `zod` to `dependencies`. Keep `"zod": "^3.23.0"`.

#### 9. `src/headless.ts` — NEW

Export all types and functions from steps 1–6 (no React). This is the entry point for non-React consumers.

#### 10. Update `src/index.ts`

Re-export everything from `./headless`. Also export the React types (`LicenseContextValue`, `LicenseProviderProps`, `LicenseGateProps`, `LicenseWarningProps`). Keep the `'use client'` directive.

#### 11. Update `tsup.config.ts`

Add `headless.ts` as a second entry point. Ensure both `index.ts` and `headless.ts` produce ESM + CJS output with `.d.ts` declarations.

#### 12. Update `package.json` exports map

Add `"./headless"` export condition pointing to `dist/headless.js` / `dist/headless.cjs` / `dist/headless.d.ts`.

#### 13. Write tests

Three test files in `src/__tests__/`:
- `polar-client.test.ts` — mock `globalThis.fetch`, test all three functions with success and error scenarios
- `cache.test.ts` — test read/write/clear/TTL/domain-scoping/SSR-safety, use `vi.setSystemTime()` for TTL tests
- `domain.test.ts` — test `isDevEnvironment()` with all dev hostnames and production hostnames, test `getCurrentDomain()` SSR behavior

### Verification Commands

```bash
# Type check
pnpm --filter @tour-kit/license typecheck

# Build
pnpm --filter @tour-kit/license build

# Run tests
pnpm --filter @tour-kit/license test

# Run tests with coverage
pnpm --filter @tour-kit/license test:coverage

# Verify jose is gone
grep -r "jose" packages/license/package.json
grep -r "jose" packages/license/src/

# Verify both entry points built
ls -la packages/license/dist/index.js packages/license/dist/headless.js
```

### Success Criteria

You are done when:
1. `pnpm --filter @tour-kit/license typecheck` passes with zero errors
2. `pnpm --filter @tour-kit/license build` produces `dist/index.js` and `dist/headless.js`
3. `pnpm --filter @tour-kit/license test` — all tests pass
4. `pnpm --filter @tour-kit/license test:coverage` — >80% line coverage for `src/lib/`
5. `grep -r "jose" packages/license/` returns zero matches
6. `grep -r "jwt\|JWT\|jwtVerify\|importSPKI" packages/license/src/` returns zero matches (excluding comments about migration)
7. The existing React code in `src/context/`, `src/hooks/`, `src/components/` is NOT modified (Phase 2 handles that)

---

## Readiness Check

Before starting Phase 1, confirm:

- [ ] Phase 0 completed — Polar sandbox validate/activate/deactivate cycle works
- [ ] `packages/license/` directory exists with current JWT-based code
- [ ] `pnpm install` completes without errors
- [ ] `pnpm --filter @tour-kit/license build` currently succeeds (old code compiles)
- [ ] Polar `organization_id` is available (from Phase 0 sandbox setup)
- [ ] vitest is configured in the license package (`vitest` in devDependencies, test scripts in `package.json`)
