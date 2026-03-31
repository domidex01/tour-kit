# Phase 1 — Core License SDK

| Field | Value |
|-------|-------|
| **Duration** | Days 3-6 (~10-13 hours) |
| **Depends on** | Phase 0 (Polar API validated, `plan/phase-0-status.json` confirms go) |
| **Blocks** | Phase 2 (React Integration), Phase 3 (Pro Package Integration) |
| **Risk Level** | MEDIUM — standard SDK engineering, Polar API already validated in Phase 0 |
| **Stack** | TypeScript (strict mode, ES2020 target, tsup bundler, Vitest) |

---

## 0. Phase 0 Findings (MUST READ)

Phase 0 validated the Polar API on 2026-03-30. **Critical discoveries that affect this phase:**

| Finding | Impact on Phase 1 |
|---------|-------------------|
| **Request bodies use `snake_case`** (`organization_id`, `activation_id`) | Zod schemas and `fetch()` calls must use snake_case in request bodies |
| **`usage` does NOT track activations** | The `usage` field stays 0 regardless of activations. Do NOT use it to count active domains. |
| **`limit_activations` is lifetime, not concurrent** | Deactivating a domain does NOT free a slot. Once 5 activations are created (even if later deactivated), no more can be added. This means activation is a one-way operation per domain. |
| **Activation limit exceeded returns HTTP 403** (not 422) | Error mapping: `PolarApiError` with `statusCode === 403` → `activation_limit_reached` |
| **Deactivation returns 204 No Content** | `deactivateKey()` must not attempt to parse response body |
| **Deactivation is unauthenticated** | Customer portal deactivate endpoint works without auth (same as validate/activate) |
| **Rate limiting at ~20 req/min** | No impact on production (single validate per page load), but test helpers should include retry logic |
| **p95 latency ~350-500ms from Asia** | Cache TTL should be **72h** (not 24h) to minimize API calls from high-latency regions |
| **Validate with `activation_id`** returns `activation` object | Use this to confirm a specific domain activation is still valid |
| **`modified_at` can be `null`** on activation objects | Type must be `string \| null`, not `string` |
| **Invalid key returns 404** (not a 200 with different status) | Error mapping: HTTP 404 → `invalid_key` |

**Activation model change:** Because `limit_activations` is lifetime (not concurrent), the auto-activation strategy must be: activate once per domain, store the `activation_id` in cache, and re-validate with that `activation_id` on subsequent visits. Never deactivate programmatically — deactivation wastes a slot permanently.

---

## 1. Objective + What Success Looks Like

**Objective:** Build the framework-agnostic license validation, activation, caching, and domain detection layer inside `packages/license/src/lib/`. Replace the existing JWT/jose-based validation with Polar.sh API calls. This phase produces zero React code — only pure TypeScript functions and types that Phase 2 will wrap in React context.

**What Success Looks Like:**

- A developer can call `validateLicenseKey(key, orgId)` and get back a typed `LicenseState` discriminated union (`valid`, `invalid`, `expired`, `revoked`, `loading`, `error`, `idle`).
- Results are cached in `localStorage` with a 72-hour TTL, scoped by domain. Corrupted cache entries are detected via Zod parse and silently cleared.
- First-time validation on a new domain auto-activates via Polar's activate endpoint (consuming one activation slot out of the customer's **lifetime** limit — deactivation does NOT free slots, so activation is a one-way operation per domain).
- `isDevEnvironment()` correctly identifies `localhost`, `127.0.0.1`, and `*.local` as dev environments.
- `validateDomainAtRender()` compares the current `window.location.hostname` against the stored activation label and logs a console warning on mismatch (soft enforcement, no hard block).
- The `jose` dependency is gone. No JWT code remains anywhere in the package.
- All three test files (`polar-client.test.ts`, `cache.test.ts`, `domain.test.ts`) pass with >80% coverage of `src/lib/`.

---

## 2. Key Design Decisions

### Discriminated Union for LicenseState

Use a discriminated union (not a flat object with optional fields) so consumers get exhaustive type checking:

```typescript
type LicenseState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; activation: LicenseActivation; expiresAt: string | null }
  | { status: 'invalid'; error: LicenseError }
  | { status: 'expired'; expiresAt: string }
  | { status: 'revoked' }
  | { status: 'error'; error: LicenseError }
```

This eliminates impossible states (e.g., `valid` with an error message) and forces callers to handle every branch via exhaustive switch.

### `type` over `interface` for Domain Models

Use `type` for all data shapes (`LicenseState`, `LicenseCache`, `PolarValidateResponse`, etc.). Reserve `interface` only if extension is needed (none expected in this phase). This is consistent with Zod's `z.infer<typeof Schema>` which produces `type` aliases.

### Zod at Boundaries Only

Zod schemas validate data at two trust boundaries:

1. **Polar API responses** — network data is untrusted. `PolarValidateResponseSchema` and `PolarActivateResponseSchema` parse the raw JSON. On parse failure, return `{ status: 'error', error: 'parse_error' }`.
2. **localStorage cache reads** — user-controlled storage is untrusted. `LicenseCacheSchema` parses cached data. On parse failure, clear the corrupted entry and force re-validation.

Internal function-to-function calls use TypeScript types only (no runtime validation overhead).

### Cache Key Scoping

Cache keys are scoped by domain to prevent cross-domain cache poisoning:

```
tourkit:license:<domain>  ->  { state: LicenseState, cachedAt: number }
```

The `<domain>` segment comes from `getCurrentDomain()`. SSR environments (no `window`) skip caching entirely.

### Activation ID Persistence

The cache must store the `activation_id` from the first successful activation. On subsequent visits, pass this `activation_id` to the validate endpoint: `POST /validate { key, organization_id, activation_id }`. This confirms the specific domain activation is still valid without creating a new activation (which would waste a lifetime slot). The flow is: activate once → store `activation_id` in cache → re-validate with `activation_id` on every subsequent visit.

### Raw `fetch()`, No SDK

Use the browser's native `fetch()` to call Polar's customer-portal endpoints. No `@polar-sh/sdk` dependency. Both endpoints require no auth headers (client-side safe). This keeps the bundle minimal and avoids SDK version coupling.

### Organization ID as Required Parameter

`validateLicenseKey()` requires both `key` and `organizationId`. The org ID is a build-time constant that the consuming app provides (typically via `<LicenseProvider organizationId="...">` in Phase 2). It is not a secret.

---

## 3. Tasks

### Task 1.1 — Define TypeScript Types (1.5h)

**File:** `packages/license/src/types/index.ts`
**Dependencies:** Phase 0 complete

Replace all existing JWT-based types with Polar-backed types. Delete: `LicensePayload`, `LicensePackage`, `LicenseFeature`, `LicenseLimits`, `LicenseValidation` (the old flat shape). Keep `LicenseTier` (rename values if needed). Add:

```typescript
/** Discriminated union -- the core state machine */
export type LicenseState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; activation: LicenseActivation; expiresAt: string | null }
  | { status: 'invalid'; error: LicenseError }
  | { status: 'expired'; expiresAt: string }
  | { status: 'revoked' }
  | { status: 'error'; error: LicenseError }

export type LicenseError =
  | 'invalid_key'
  | 'network_error'
  | 'parse_error'
  | 'activation_limit_reached'
  | 'domain_mismatch'

export type LicenseActivation = {
  id: string
  licenseKeyId: string
  label: string          // domain name
  createdAt: string
  modifiedAt: string | null  // null on first creation (confirmed Phase 0)
}

/** Shape stored in localStorage */
export type LicenseCache = {
  state: LicenseState
  cachedAt: number       // Date.now() when written
  domain: string
}

/** Raw Polar validate response (after camelCase transform) */
export type PolarValidateResponse = {
  id: string
  organizationId: string
  status: 'granted' | 'revoked' | 'disabled'
  key: string
  limitActivations: number | null
  usage: number
  validations: number
  lastValidatedAt: string
  expiresAt: string | null
  activation: {
    id: string
    licenseKeyId: string
    label: string
    meta: Record<string, unknown>
    createdAt: string
    modifiedAt: string
  } | null
}

/** Raw Polar activate response (after camelCase transform) */
export type PolarActivateResponse = {
  id: string
  licenseKeyId: string
  label: string
  meta: Record<string, unknown>
  createdAt: string
  modifiedAt: string
  licenseKey: {
    id: string
    organizationId: string
    status: 'granted' | 'revoked' | 'disabled'
    limitActivations: number | null
    usage: number
    limitUsage: number | null
    validations: number
    lastValidatedAt: string
    expiresAt: string | null
  }
}

/** Config passed to validateLicenseKey() */
export type LicenseConfig = {
  key: string
  organizationId: string
}
```

Also update `LicenseContextValue` and `LicenseProviderProps` to reference the new `LicenseState` type. Update `LicenseGateProps` to use a simple `require?: 'pro'` prop instead of the old feature/package/tier system.

---

### Task 1.2 — Write Zod Schemas (1h)

**File:** `packages/license/src/lib/schemas.ts` (new)
**Dependencies:** 1.1

Three schemas matching the Polar wire format (snake_case):

```typescript
import { z } from 'zod'

export const PolarValidateResponseSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  status: z.enum(['granted', 'revoked', 'disabled']),
  key: z.string(),
  limit_activations: z.number().nullable(),
  usage: z.number(),
  validations: z.number(),
  last_validated_at: z.string(),
  expires_at: z.string().nullable(),
  activation: z.object({
    id: z.string(),
    license_key_id: z.string(),
    label: z.string(),
    meta: z.record(z.unknown()),
    created_at: z.string(),
    modified_at: z.string().nullable(),  // null on first creation
  }).nullable(),
})

export const PolarActivateResponseSchema = z.object({
  id: z.string(),
  license_key_id: z.string(),
  label: z.string(),
  meta: z.record(z.unknown()),
  created_at: z.string(),
  modified_at: z.string().nullable(),
  license_key: z.object({
    id: z.string(),
    organization_id: z.string(),
    status: z.enum(['granted', 'revoked', 'disabled']),
    limit_activations: z.number().nullable(),
    usage: z.number(),
    limit_usage: z.number().nullable(),
    validations: z.number(),
    last_validated_at: z.string(),
    expires_at: z.string().nullable(),
  }),
})

export const LicenseCacheSchema = z.object({
  state: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('valid'),
      activation: z.object({
        id: z.string(),
        licenseKeyId: z.string(),
        label: z.string(),
        createdAt: z.string(),
        modifiedAt: z.string(),
      }),
      expiresAt: z.string().nullable(),
    }),
    z.object({ status: z.literal('invalid'), error: z.string() }),
    z.object({ status: z.literal('expired'), expiresAt: z.string() }),
    z.object({ status: z.literal('revoked') }),
    z.object({ status: z.literal('loading') }),
    z.object({ status: z.literal('error'), error: z.string() }),
    z.object({ status: z.literal('idle') }),
  ]),
  cachedAt: z.number(),
  domain: z.string(),
})
```

Note: Polar API schemas use `snake_case` to match the wire format. `LicenseCacheSchema` uses `camelCase` because cache stores our transformed types. Add `"zod": "catalog:"` to `package.json` dependencies.

---

### Task 1.3 — Implement polar-client.ts (1.5h)

**File:** `packages/license/src/lib/polar-client.ts` (new)
**Dependencies:** 1.2

Three low-level functions using raw `fetch()`:

```typescript
const POLAR_API_BASE = 'https://api.polar.sh/v1/customer-portal/license-keys'

/** POST /validate -- no auth header needed */
export async function validateKey(
  key: string,
  organizationId: string
): Promise<PolarValidateResponse> {
  const res = await fetch(`${POLAR_API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: organizationId }),
  })
  if (!res.ok) throw new PolarApiError(res.status, await res.text())
  const json: unknown = await res.json()
  const parsed = PolarValidateResponseSchema.safeParse(json)
  if (!parsed.success) throw new PolarParseError(parsed.error)
  return transformValidateResponse(parsed.data)
}

/** POST /activate -- no auth header needed */
export async function activateKey(
  key: string,
  organizationId: string,
  label: string
): Promise<PolarActivateResponse> { /* same pattern */ }

/** POST /deactivate -- no auth header needed */
export async function deactivateKey(
  key: string,
  organizationId: string,
  activationId: string
): Promise<void> { /* POST, check res.ok, no body to parse */ }
```

Error classes:
- `PolarApiError` (HTTP non-200) — stores `statusCode` and `message`
- `PolarParseError` (Zod failure) — stores `ZodError`

Both extend `Error`. Export them for test assertions.

Include `transformValidateResponse()` and `transformActivateResponse()` helpers that map `snake_case` Polar fields to the `camelCase` TypeScript types from Task 1.1.

---

### Task 1.4 — Implement cache.ts (1h)

**File:** `packages/license/src/lib/cache.ts` (new)
**Dependencies:** 1.1

```typescript
const CACHE_PREFIX = 'tourkit:license:'
const CACHE_TTL_MS = 72 * 60 * 60 * 1000  // 72 hours (adjusted per Phase 0 latency findings)

export function readCache(domain: string): LicenseState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${domain}`)
    if (!raw) return null
    const json: unknown = JSON.parse(raw)
    const parsed = LicenseCacheSchema.safeParse(json)
    if (!parsed.success) { clearCache(domain); return null }
    if (Date.now() - parsed.data.cachedAt > CACHE_TTL_MS) { clearCache(domain); return null }
    return parsed.data.state
  } catch {
    clearCache(domain)
    return null
  }
}

export function writeCache(domain: string, state: LicenseState): void {
  if (typeof window === 'undefined') return
  const entry: LicenseCache = { state, cachedAt: Date.now(), domain }
  localStorage.setItem(`${CACHE_PREFIX}${domain}`, JSON.stringify(entry))
}

export function clearCache(domain: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${CACHE_PREFIX}${domain}`)
}
```

The `try/catch` around `JSON.parse` handles malformed JSON. The `LicenseCacheSchema.safeParse` handles valid JSON with wrong shape. Both failure modes silently clear the entry and return `null`, forcing re-validation on the next call. This integrates Task 1.11 (cache integrity) directly into the implementation.

---

### Task 1.5 — Implement domain.ts (0.5h)

**File:** `packages/license/src/lib/domain.ts` (new)
**Dependencies:** None

```typescript
const DEV_HOSTNAMES = ['localhost', '127.0.0.1']
const DEV_SUFFIX = '.local'

export function getCurrentDomain(): string | null {
  if (typeof window === 'undefined') return null
  return window.location.hostname
}

export function isDevEnvironment(): boolean {
  const domain = getCurrentDomain()
  if (!domain) return false
  return DEV_HOSTNAMES.includes(domain) || domain.endsWith(DEV_SUFFIX)
}
```

---

### Task 1.6 — Implement validateLicenseKey() Orchestrator (1.5h)

**File:** `packages/license/src/lib/polar-client.ts` (extended)
**Dependencies:** 1.3, 1.4, 1.5

The single public entry point for the entire validation flow:

```typescript
export async function validateLicenseKey(config: LicenseConfig): Promise<LicenseState> {
  const { key, organizationId } = config
  const domain = getCurrentDomain()

  // 1. Dev bypass -- skip API call on localhost/127.0.0.1/*.local
  if (isDevEnvironment()) {
    return { status: 'valid', activation: DEV_ACTIVATION, expiresAt: null }
  }

  // 2. Cache check -- return immediately if cached and within TTL
  if (domain) {
    const cached = readCache(domain)
    if (cached) return cached
  }

  try {
    // 3. Check for stored activation_id from a previous activation
    const storedActivationId = domain ? readActivationId(domain) : undefined

    // 4. Validate against Polar API (with activation_id if available)
    const response = await validateKey(key, organizationId, storedActivationId)

    // 5. Map Polar status to LicenseState
    if (response.status === 'revoked') {
      const state: LicenseState = { status: 'revoked' }
      if (domain) writeCache(domain, state)
      return state
    }

    if (response.expiresAt && new Date(response.expiresAt) < new Date()) {
      const state: LicenseState = { status: 'expired', expiresAt: response.expiresAt }
      if (domain) writeCache(domain, state)
      return state
    }

    // 6. Auto-activate if no activation exists for this domain
    //    WARNING: activation is a one-way operation (lifetime limit, not concurrent)
    let activation = response.activation
      ? {
          id: response.activation.id,
          licenseKeyId: response.activation.licenseKeyId,
          label: response.activation.label,
          createdAt: response.activation.createdAt,
          modifiedAt: response.activation.modifiedAt,
        }
      : null

    if (!activation && domain) {
      const activateResponse = await activateKey(key, organizationId, domain)
      activation = {
        id: activateResponse.id,
        licenseKeyId: activateResponse.licenseKeyId,
        label: activateResponse.label,
        createdAt: activateResponse.createdAt,
        modifiedAt: activateResponse.modifiedAt,
      }
    }

    const state: LicenseState = {
      status: 'valid',
      activation: activation!,
      expiresAt: response.expiresAt,
    }
    if (domain) writeCache(domain, state)
    return state
  } catch (error) {
    if (error instanceof PolarApiError && error.statusCode === 404) {
      return { status: 'invalid', error: 'invalid_key' }
    }
    if (error instanceof PolarApiError && error.statusCode === 403) {
      return { status: 'invalid', error: 'activation_limit_reached' }
    }
    return { status: 'error', error: 'network_error' }
  }
}
```

`DEV_ACTIVATION` is a module-level constant with synthetic values so the return type stays consistent.

---

### Task 1.7 — Remove jose, Delete JWT Code (0.5h)

**Files:** `packages/license/package.json`, delete `packages/license/src/utils/validate.ts`
**Dependencies:** 1.3

1. Delete `packages/license/src/utils/validate.ts` (133 lines of JWT code).
2. Delete `packages/license/src/utils/` directory if empty.
3. Remove `"jose": "^5.9.0"` from `dependencies` in `package.json`.
4. Add `"zod": "catalog:"` to `dependencies` in `package.json`.
5. Remove `jose` and `jwt` from `package.json` keywords array.
6. Update `src/index.ts` to remove `export { validateLicense, validateDomain, getCurrentDomain } from './utils/validate'`.
7. Run `pnpm install` to update lockfile.

---

### Task 1.8 — Write Unit Tests (2h)

**Directory:** `packages/license/src/__tests__/`
**Dependencies:** 1.3-1.6

**`polar-client.test.ts`** — Mock global `fetch` via `vi.stubGlobal`:
- `validateKey()` returns parsed response for valid key
- `validateKey()` throws `PolarApiError` for 404 (invalid key)
- `validateKey()` throws `PolarParseError` for malformed response body
- `activateKey()` returns activation with correct label
- `activateKey()` throws `PolarApiError` for 403 (activation limit reached)
- `deactivateKey()` completes successfully (204 response)
- `validateLicenseKey()` orchestrator: cache hit returns cached state without API call
- `validateLicenseKey()` orchestrator: cache miss calls validate then auto-activate
- `validateLicenseKey()` orchestrator: revoked key returns `{ status: 'revoked' }`
- `validateLicenseKey()` orchestrator: network failure returns `{ status: 'error', error: 'network_error' }`

**`cache.test.ts`** — Mock `localStorage` via `vi.stubGlobal`:
- `writeCache()` + `readCache()` round-trip preserves state
- `readCache()` returns `null` for expired entry (TTL exceeded)
- `readCache()` returns `null` and clears entry for corrupted JSON
- `readCache()` returns `null` and clears entry for Zod parse failure (valid JSON, wrong shape)
- `clearCache()` removes the correct key
- All functions are no-ops when `window` is `undefined` (SSR safety)

**`domain.test.ts`** — Mock `window.location.hostname`:
- `getCurrentDomain()` returns `window.location.hostname`
- `getCurrentDomain()` returns `null` when `window` is `undefined` (SSR)
- `isDevEnvironment()` returns `true` for `localhost`
- `isDevEnvironment()` returns `true` for `127.0.0.1`
- `isDevEnvironment()` returns `true` for `myapp.local`
- `isDevEnvironment()` returns `false` for `example.com`
- `validateDomainAtRender()` logs `console.warn` on hostname mismatch
- `validateDomainAtRender()` does not log when hostname matches activation label
- `validateDomainAtRender()` returns `true` in SSR (no `window`)
- `validateDomainAtRender()` returns `true` in dev environment (skip check)

---

### Task 1.9 — Update headless.ts Exports (0.5h)

**File:** `packages/license/src/headless.ts` (new)
**Dependencies:** 1.1-1.6

Framework-agnostic entry point exporting types and pure functions only (no React):

```typescript
// Types
export type {
  LicenseState,
  LicenseError,
  LicenseActivation,
  LicenseCache,
  LicenseConfig,
  PolarValidateResponse,
  PolarActivateResponse,
} from './types'

// Polar client
export {
  validateLicenseKey,
  validateKey,
  activateKey,
  deactivateKey,
  PolarApiError,
  PolarParseError,
} from './lib/polar-client'

// Cache
export { readCache, writeCache, clearCache } from './lib/cache'

// Domain
export { getCurrentDomain, isDevEnvironment, validateDomainAtRender } from './lib/domain'
```

Phase 2 will register `headless.ts` as a second tsup entry point.

---

### Task 1.10 — Implement validateDomainAtRender() (1h)

**File:** `packages/license/src/lib/domain.ts` (extended)
**Dependencies:** 1.5

```typescript
/**
 * Compares current hostname against the stored activation label.
 * Logs a console warning on mismatch. Soft enforcement only --
 * returns boolean but never blocks rendering.
 */
export function validateDomainAtRender(activationLabel: string): boolean {
  const currentDomain = getCurrentDomain()
  if (!currentDomain) return true   // SSR -- cannot check, assume ok
  if (isDevEnvironment()) return true  // dev -- always pass

  if (currentDomain !== activationLabel) {
    console.warn(
      `[tour-kit/license] Domain mismatch: license activated for "${activationLabel}" ` +
      `but running on "${currentDomain}". Components will render with a watermark. ` +
      `Activate this domain in your Polar dashboard or contact support.`
    )
    return false
  }
  return true
}
```

---

### Task 1.11 — Cache Integrity Validation (1h)

**File:** `packages/license/src/lib/cache.ts` + `packages/license/src/lib/schemas.ts` (extended)
**Dependencies:** 1.2, 1.4

Integrated directly into `readCache()` (see Task 1.4 implementation). The three failure modes:

1. **Malformed JSON** — `JSON.parse()` throws. Caught by outer `try/catch`. Calls `clearCache(domain)`, returns `null`.
2. **Wrong shape** — `LicenseCacheSchema.safeParse()` returns `{ success: false }`. Calls `clearCache(domain)`, returns `null`.
3. **Expired TTL** — `Date.now() - cachedAt > CACHE_TTL_MS`. Calls `clearCache(domain)`, returns `null`.

All three are silent (no console output). The next `validateLicenseKey()` call hits Polar's API and writes a fresh cache entry.

---

## 4. Deliverables

```
packages/license/
├── src/
│   ├── types/
│   │   └── index.ts                 # LicenseState, LicenseCache, LicenseError, Polar response types
│   ├── lib/
│   │   ├── polar-client.ts          # validateKey, activateKey, deactivateKey, validateLicenseKey
│   │   ├── cache.ts                 # readCache, writeCache, clearCache (Zod integrity built-in)
│   │   ├── domain.ts                # getCurrentDomain, isDevEnvironment, validateDomainAtRender
│   │   └── schemas.ts              # PolarValidateResponseSchema, PolarActivateResponseSchema, LicenseCacheSchema
│   ├── headless.ts                  # Framework-agnostic public API (types + functions, no React)
│   └── __tests__/
│       ├── polar-client.test.ts     # API calls + orchestrator tests (mocked fetch)
│       ├── cache.test.ts            # localStorage TTL + Zod integrity tests
│       └── domain.test.ts           # Dev detection + render-time domain verification tests
├── package.json                     # jose removed, zod added
```

**Deleted files:**
- `packages/license/src/utils/validate.ts` (old JWT validation)
- `packages/license/src/utils/` (directory, if empty after deletion)

---

## 5. Exit Criteria

| # | Criterion | Verified By |
|---|-----------|------------|
| 1 | `validateLicenseKey()` returns `{ status: 'valid' }` for a valid key with correct activation | `polar-client.test.ts` |
| 2 | `validateLicenseKey()` returns `{ status: 'invalid', error: 'invalid_key' }` for an invalid key | `polar-client.test.ts` |
| 3 | `validateLicenseKey()` returns `{ status: 'revoked' }` for a revoked key | `polar-client.test.ts` |
| 4 | Cache returns stored result within 24h TTL without making an API call | `cache.test.ts` |
| 5 | Cache re-validates after TTL expires (returns `null`, triggering fresh API call) | `cache.test.ts` |
| 6 | Corrupted cache entries (malformed JSON) detected and cleared automatically | `cache.test.ts` |
| 7 | Tampered cache entries (valid JSON, wrong shape) detected via Zod parse and cleared | `cache.test.ts` |
| 8 | `validateDomainAtRender()` logs `console.warn` when hostname mismatches activation label | `domain.test.ts` |
| 9 | `isDevEnvironment()` returns `true` for `localhost`, `127.0.0.1`, `*.local` | `domain.test.ts` |
| 10 | `jose` removed from `package.json` dependencies | `grep jose packages/license/package.json` returns 0 results |
| 11 | No JWT code remains in `src/` | `grep -r "jose\|jwt\|JWS\|JWE\|importSPKI" packages/license/src/` returns 0 results |
| 12 | All 3 test files pass | `pnpm test --filter=@tour-kit/license` exits 0 |
| 13 | Coverage >80% of `src/lib/` | `pnpm test:coverage --filter=@tour-kit/license` |

---

## 6. Execution Prompt

You are implementing Phase 1 of the Tour Kit licensing system. Your job is to build the framework-agnostic license validation SDK inside `packages/license/`. This phase produces zero React components — only TypeScript types, Zod schemas, and pure functions.

### Context

**Repository:** Tour Kit is a headless onboarding/product tour library (pnpm monorepo, Turborepo, tsup bundler, Vitest test runner).
**Package:** `packages/license/` currently has JWT-based validation via `jose`. You are replacing it with Polar.sh API calls.
**Phase 0 is complete:** Polar's customer-portal endpoints work end-to-end. No auth headers are needed for validate/activate/deactivate.

### Current State of `packages/license/`

- `src/types/index.ts` — Old JWT types (`LicensePayload`, `LicensePackage`, `LicenseFeature`, `LicenseLimits`, `LicenseValidation`, `LicenseError`, `LicenseContextValue`, `LicenseProviderProps`, `LicenseGateProps`, `LicenseWarningProps`). Replace entirely with Polar-backed types.
- `src/utils/validate.ts` — Old JWT validation using `jose` (`validateLicense()`, `validateDomain()`, `getCurrentDomain()`). **Delete this file.**
- `src/index.ts` — Re-exports old types and old validate functions. Update to remove old exports.
- `package.json` — Has `"jose": "^5.9.0"` in dependencies. Remove it, add `"zod": "catalog:"`.
- `src/context/`, `src/components/`, `src/hooks/` — Existing directories for Phase 2 React work. Do not modify these in Phase 1.
- No `src/lib/` directory exists yet. Create it.
- No `src/headless.ts` exists yet. Create it.

### Polar API Endpoints (confirmed working, no auth required)

**Validate:**
```
POST https://api.polar.sh/v1/customer-portal/license-keys/validate
Content-Type: application/json
Body: { "key": "<license_key>", "organization_id": "<org_id>" }

Response 200:
{
  "id": "string",
  "organization_id": "string",
  "status": "granted" | "revoked" | "disabled",
  "key": "string",
  "limit_activations": number | null,
  "usage": number,
  "validations": number,
  "last_validated_at": "string",
  "expires_at": "string" | null,
  "activation": {
    "id": "string",
    "license_key_id": "string",
    "label": "string",
    "meta": {},
    "created_at": "string",
    "modified_at": "string"
  } | null
}

Response 404: invalid key
```

**Activate:**
```
POST https://api.polar.sh/v1/customer-portal/license-keys/activate
Content-Type: application/json
Body: { "key": "<license_key>", "organization_id": "<org_id>", "label": "<domain>" }

Response 200:
{
  "id": "string",
  "license_key_id": "string",
  "label": "string",
  "meta": {},
  "created_at": "string",
  "modified_at": "string",
  "license_key": {
    "id": "string",
    "organization_id": "string",
    "status": "granted" | "revoked" | "disabled",
    "limit_activations": number | null,
    "usage": number,
    "limit_usage": number | null,
    "validations": number,
    "last_validated_at": "string",
    "expires_at": "string" | null
  }
}

Response 403: activation limit reached (NOT 422 — confirmed in Phase 0)
```

**Deactivate:**
```
POST https://api.polar.sh/v1/customer-portal/license-keys/deactivate
Content-Type: application/json
Body: { "key": "<license_key>", "organization_id": "<org_id>", "activation_id": "<id>" }

Response 204: success (no body)
```

### Zod Patterns (v3.24.x)

```typescript
import { z } from 'zod'
const Schema = z.object({ key: z.string(), status: z.enum(['granted', 'revoked']) })
type SchemaType = z.infer<typeof Schema>
const result = Schema.safeParse(data) // { success: boolean, data?, error? }
```

### Implementation Order

Execute tasks in this exact sequence:

**Step 1 — Types** (`src/types/index.ts`):
Replace all old JWT types. Define: `LicenseState` (discriminated union: `idle | loading | valid | invalid | expired | revoked | error`), `LicenseError`, `LicenseActivation`, `LicenseCache`, `LicenseConfig`, `PolarValidateResponse`, `PolarActivateResponse`. Update `LicenseContextValue` and `LicenseProviderProps` to use new `LicenseState`. Keep `LicenseTier` as `'free' | 'pro'`.

**Step 2 — Schemas** (`src/lib/schemas.ts`):
Create `PolarValidateResponseSchema` and `PolarActivateResponseSchema` using snake_case field names (matching Polar wire format). Create `LicenseCacheSchema` using camelCase (matching our types). Export all three schemas.

**Step 3 — Polar Client** (`src/lib/polar-client.ts`):
Implement `validateKey()`, `activateKey()`, `deactivateKey()` using raw `fetch()`. Each: POST to Polar endpoint, check `res.ok`, Zod-parse JSON body, transform snake_case to camelCase. Define error classes `PolarApiError` (stores statusCode + message) and `PolarParseError` (stores ZodError). Include `transformValidateResponse()` and `transformActivateResponse()` helpers.

**Step 4 — Cache** (`src/lib/cache.ts`):
Implement `readCache(domain)`, `writeCache(domain, state)`, `clearCache(domain)`. Cache key: `tourkit:license:<domain>`. TTL: 72 hours. `readCache` wraps `JSON.parse` in try/catch, then runs `LicenseCacheSchema.safeParse()`. Any failure clears the entry and returns `null`. All functions SSR-safe (`typeof window` check).

**Step 5 — Domain** (`src/lib/domain.ts`):
Implement `getCurrentDomain()` (returns `window.location.hostname` or `null` in SSR), `isDevEnvironment()` (matches `localhost`, `127.0.0.1`, `*.local`), `validateDomainAtRender(activationLabel)` (compares hostname vs label, logs `console.warn` on mismatch, returns boolean, skips check in SSR and dev).

**Step 6 — Orchestrator** (extend `src/lib/polar-client.ts`):
Implement `validateLicenseKey(config: LicenseConfig): Promise<LicenseState>`. Flow: dev environment check (return synthetic valid) -> cache read (return if hit) -> `validateKey()` call -> check status (revoked/expired) -> auto-activate if no activation for this domain -> cache write -> return state. Error mapping: HTTP 404 = `invalid_key`, HTTP 403 = `activation_limit_reached`, other = `network_error`.

**Step 7 — Remove jose**:
Delete `src/utils/validate.ts`. Delete `src/utils/` if empty. Remove `jose` from `package.json` dependencies. Add `zod` to dependencies. Remove `jose`/`jwt` from keywords. Update `src/index.ts` to remove old validate exports. Run `pnpm install`.

**Step 8 — Headless exports** (`src/headless.ts`):
Export all types from `./types` and all functions from `./lib/polar-client`, `./lib/cache`, `./lib/domain`.

**Step 9 — Tests** (3 files in `src/__tests__/`):
- `polar-client.test.ts`: Mock `fetch` via `vi.stubGlobal`. Test all three low-level functions + the orchestrator (cache hit, cache miss + activate, revoked, expired, network error, invalid key, activation limit).
- `cache.test.ts`: Mock `localStorage`. Test round-trip, TTL expiry, corrupted JSON, Zod parse failure, SSR safety.
- `domain.test.ts`: Mock `window.location`. Test all dev hostnames, production hostname, `validateDomainAtRender` match/mismatch/SSR/dev.

### Constraints

- TypeScript strict mode. No `any`. No `as` casts except for test mocks.
- All functions must be SSR-safe (`typeof window !== 'undefined'` before browser API access).
- No React imports in any file created in this phase.
- Use `type` not `interface` for all data shapes.
- Run `pnpm typecheck --filter=@tour-kit/license` to verify zero type errors.
- Run `pnpm test --filter=@tour-kit/license` to verify all tests pass.
- Run `pnpm test:coverage --filter=@tour-kit/license` to verify >80% coverage of `src/lib/`.

---

## Readiness Check

Before starting Phase 1, verify all of the following:

- [ ] **Phase 0 complete:** `plan/phase-0-status.json` exists and contains `"decision": "proceed"`
- [ ] **Polar sandbox active:** Validate endpoint returns 200 for a test key
- [ ] **Zod available:** `pnpm ls zod` confirms Zod is in the monorepo catalog (used by other packages)
- [ ] **Vitest configured:** `pnpm test --filter=@tour-kit/license` runs without config errors (even if no tests pass yet)
- [ ] **tsup configured:** `pnpm build --filter=@tour-kit/license` produces `dist/` output
- [ ] **No blocking changes:** `git status packages/license/` shows no uncommitted work that conflicts with this phase
