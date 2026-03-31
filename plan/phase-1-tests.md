# Phase 1 Test Plan -- Core License SDK

| Field | Value |
|-------|-------|
| **Phase** | 1 -- Core License SDK |
| **Type** | Service (SDK with external API + localStorage cache) |
| **Test Runner** | Vitest (jsdom environment) |
| **Test Files** | 3 files, ~30 test cases |
| **Coverage Target** | >80% of `src/lib/` |

---

## 1. Mock Strategy

### Global Mocks

**`fetch`** -- Mock `globalThis.fetch` via `vi.stubGlobal('fetch', vi.fn())`. Each test configures the mock to return a specific `Response` object. Reset between tests with `vi.restoreAllMocks()`.

**`localStorage`** -- Create an in-memory `Storage` implementation and stub via `vi.stubGlobal('localStorage', createMockLocalStorage())`. This avoids jsdom's built-in localStorage which may carry state between tests.

**`window.location`** -- Use `vi.stubGlobal('location', { hostname: 'example.com' })` to control `window.location.hostname` per test. For SSR tests, temporarily delete `window` or stub `getCurrentDomain` to return `null`.

**`Date.now`** -- Use `vi.spyOn(Date, 'now')` for TTL expiry tests in cache.

**`console.warn`** -- Use `vi.spyOn(console, 'warn').mockImplementation(() => {})` to assert warning calls in `validateDomainAtRender`.

### No Real API Calls

All Polar API interactions are mocked at the `fetch` level. No network requests leave the test process.

---

## 2. Fake Implementations

### Mock localStorage

```typescript
function createMockLocalStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}
```

### Mock fetch Response Factory

```typescript
function mockFetchResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response
}
```

### Polar API Fixture Data

```typescript
const VALID_VALIDATE_RESPONSE = {
  id: 'lk_test_123',
  organization_id: 'org_test_456',
  status: 'granted' as const,
  key: 'TK-XXXX-XXXX-XXXX',
  limit_activations: 5,
  usage: 1,
  validations: 10,
  last_validated_at: '2026-03-29T00:00:00Z',
  expires_at: null,
  activation: {
    id: 'act_test_789',
    license_key_id: 'lk_test_123',
    label: 'example.com',
    meta: {},
    created_at: '2026-03-01T00:00:00Z',
    modified_at: '2026-03-01T00:00:00Z',
  },
}

const VALID_VALIDATE_RESPONSE_NO_ACTIVATION = {
  ...VALID_VALIDATE_RESPONSE,
  activation: null,
}

const REVOKED_VALIDATE_RESPONSE = {
  ...VALID_VALIDATE_RESPONSE,
  status: 'revoked' as const,
}

const EXPIRED_VALIDATE_RESPONSE = {
  ...VALID_VALIDATE_RESPONSE,
  expires_at: '2025-01-01T00:00:00Z', // in the past
}

const VALID_ACTIVATE_RESPONSE = {
  id: 'act_test_new',
  license_key_id: 'lk_test_123',
  label: 'example.com',
  meta: {},
  created_at: '2026-03-30T00:00:00Z',
  modified_at: '2026-03-30T00:00:00Z',
  license_key: {
    id: 'lk_test_123',
    organization_id: 'org_test_456',
    status: 'granted' as const,
    limit_activations: 5,
    usage: 2,
    limit_usage: null,
    validations: 11,
    last_validated_at: '2026-03-30T00:00:00Z',
    expires_at: null,
  },
}

const VALID_CACHE_ENTRY = {
  state: {
    status: 'valid' as const,
    activation: {
      id: 'act_test_789',
      licenseKeyId: 'lk_test_123',
      label: 'example.com',
      createdAt: '2026-03-01T00:00:00Z',
      modifiedAt: '2026-03-01T00:00:00Z',
    },
    expiresAt: null,
  },
  cachedAt: Date.now(),
  domain: 'example.com',
}
```

---

## 3. Test File: `src/__tests__/polar-client.test.ts`

Tests for `src/lib/polar-client.ts` -- low-level API functions and the orchestrator.

### Setup

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateKey,
  activateKey,
  deactivateKey,
  validateLicenseKey,
  PolarApiError,
  PolarParseError,
} from '../lib/polar-client'

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
  // Mock localStorage for orchestrator tests
  vi.stubGlobal('localStorage', createMockLocalStorage())
  // Default to production domain
  vi.stubGlobal('location', { hostname: 'example.com' })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
```

### Test Cases

#### `describe('validateKey')`

| # | Test | Assert |
|---|------|--------|
| 1 | returns parsed response for valid key | `mockFetch` returns 200 + `VALID_VALIDATE_RESPONSE`. Result has camelCase fields: `organizationId`, `limitActivations`, `lastValidatedAt`, `expiresAt`, `activation.licenseKeyId`, `activation.createdAt`, `activation.modifiedAt`. |
| 2 | throws PolarApiError for 404 (invalid key) | `mockFetch` returns 404. `expect(call).rejects.toThrow(PolarApiError)`. Error has `statusCode === 404`. |
| 3 | throws PolarParseError for malformed response body | `mockFetch` returns 200 + `{ garbage: true }`. `expect(call).rejects.toThrow(PolarParseError)`. |
| 4 | sends correct request body | After call, assert `mockFetch` was called with URL ending `/validate`, method `POST`, body containing `key` and `organization_id`. |

#### `describe('activateKey')`

| # | Test | Assert |
|---|------|--------|
| 5 | returns activation with correct label | `mockFetch` returns 200 + `VALID_ACTIVATE_RESPONSE`. Result has `label === 'example.com'`, `licenseKeyId` set. |
| 6 | throws PolarApiError for 403 (activation limit) | `mockFetch` returns 403. `expect(call).rejects.toThrow(PolarApiError)`. Error has `statusCode === 403`. |
| 7 | sends correct request body including label | Assert `mockFetch` body contains `key`, `organization_id`, and `label`. |

#### `describe('deactivateKey')`

| # | Test | Assert |
|---|------|--------|
| 8 | completes successfully for 204 response | `mockFetch` returns 204 (no body). Call resolves without throwing. |
| 9 | throws PolarApiError for non-ok response | `mockFetch` returns 404. `expect(call).rejects.toThrow(PolarApiError)`. |

#### `describe('validateLicenseKey')`

| # | Test | Assert |
|---|------|--------|
| 10 | returns cached state without API call (cache hit) | Pre-populate localStorage with valid cache entry. Call `validateLicenseKey()`. Assert `mockFetch` was NOT called. Result has `status === 'valid'`. |
| 11 | calls validate then auto-activates on cache miss | `mockFetch` returns `VALID_VALIDATE_RESPONSE_NO_ACTIVATION` on first call, `VALID_ACTIVATE_RESPONSE` on second. Assert `mockFetch` called twice. Result has `status === 'valid'` with activation from activate response. |
| 12 | returns valid with existing activation (no auto-activate) | `mockFetch` returns `VALID_VALIDATE_RESPONSE` (has activation). Assert `mockFetch` called once. Result has `status === 'valid'`. |
| 13 | returns `{ status: 'revoked' }` for revoked key | `mockFetch` returns `REVOKED_VALIDATE_RESPONSE`. Result is `{ status: 'revoked' }`. |
| 14 | returns `{ status: 'expired' }` for expired key | `mockFetch` returns `EXPIRED_VALIDATE_RESPONSE`. Result has `status === 'expired'`, `expiresAt` set. |
| 15 | returns `{ status: 'invalid', error: 'invalid_key' }` for 404 | `mockFetch` returns 404. Result matches expected shape. |
| 16 | returns `{ status: 'invalid', error: 'activation_limit_reached' }` for 403 | First `mockFetch` (validate) returns `VALID_VALIDATE_RESPONSE_NO_ACTIVATION`, second (activate) returns 403. Result matches expected shape. |
| 17 | returns `{ status: 'error', error: 'network_error' }` for fetch failure | `mockFetch` rejects with `TypeError('Failed to fetch')`. Result matches expected shape. |
| 18 | returns synthetic valid state in dev environment | Stub `location.hostname` to `localhost`. Call `validateLicenseKey()`. Assert `mockFetch` NOT called. Result has `status === 'valid'`. |
| 19 | writes result to cache after successful validation | `mockFetch` returns `VALID_VALIDATE_RESPONSE`. After call, assert `localStorage.setItem` was called with key `tourkit:license:example.com`. |

---

## 4. Test File: `src/__tests__/cache.test.ts`

Tests for `src/lib/cache.ts` -- localStorage operations with TTL and Zod integrity.

### Setup

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readCache, writeCache, clearCache } from '../lib/cache'

let mockStorage: ReturnType<typeof createMockLocalStorage>

beforeEach(() => {
  mockStorage = createMockLocalStorage()
  vi.stubGlobal('localStorage', mockStorage)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
```

### Test Cases

#### `describe('writeCache + readCache round-trip')`

| # | Test | Assert |
|---|------|--------|
| 1 | round-trip preserves valid state | `writeCache('example.com', validState)` then `readCache('example.com')` returns equivalent state with `status === 'valid'`, matching activation fields. |
| 2 | different domains are isolated | Write to `a.com` and `b.com` with different states. `readCache('a.com')` and `readCache('b.com')` return their respective states. |

#### `describe('readCache TTL')`

| # | Test | Assert |
|---|------|--------|
| 3 | returns cached state within TTL | Write cache, then immediately read. Returns the state. |
| 4 | returns null for expired entry (TTL exceeded) | Write cache with `cachedAt` = `Date.now() - 25 * 60 * 60 * 1000` (25 hours ago) by directly setting localStorage. `readCache()` returns `null`. |
| 5 | clears expired entry from storage | After reading an expired entry, assert `localStorage.removeItem` was called. |

#### `describe('readCache integrity')`

| # | Test | Assert |
|---|------|--------|
| 6 | returns null and clears entry for corrupted JSON | Set `localStorage` to `'not{valid json'` for the cache key. `readCache()` returns `null`. Assert `removeItem` called. |
| 7 | returns null and clears entry for wrong shape (Zod failure) | Set `localStorage` to `JSON.stringify({ wrong: 'shape' })`. `readCache()` returns `null`. Assert `removeItem` called. |
| 8 | returns null and clears entry for missing required fields | Set valid JSON missing `cachedAt`. `readCache()` returns `null`. Assert `removeItem` called. |

#### `describe('clearCache')`

| # | Test | Assert |
|---|------|--------|
| 9 | removes the correct key | `clearCache('example.com')`. Assert `localStorage.removeItem` called with `'tourkit:license:example.com'`. |
| 10 | does not affect other domains | Write to `a.com` and `b.com`. `clearCache('a.com')`. `readCache('b.com')` still returns state. |

#### `describe('SSR safety')`

| # | Test | Assert |
|---|------|--------|
| 11 | readCache returns null when window is undefined | Temporarily stub `globalThis.window` as `undefined`. `readCache('example.com')` returns `null`. |
| 12 | writeCache is a no-op when window is undefined | Temporarily stub `globalThis.window` as `undefined`. `writeCache()` does not throw. |
| 13 | clearCache is a no-op when window is undefined | Temporarily stub `globalThis.window` as `undefined`. `clearCache()` does not throw. |

---

## 5. Test File: `src/__tests__/domain.test.ts`

Tests for `src/lib/domain.ts` -- domain detection, dev environment checks, render-time validation.

### Setup

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCurrentDomain, isDevEnvironment, validateDomainAtRender } from '../lib/domain'

beforeEach(() => {
  vi.stubGlobal('location', { hostname: 'example.com' })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
```

### Test Cases

#### `describe('getCurrentDomain')`

| # | Test | Assert |
|---|------|--------|
| 1 | returns window.location.hostname | Stub hostname to `'myapp.com'`. Returns `'myapp.com'`. |
| 2 | returns null when window is undefined (SSR) | Temporarily delete/stub `window`. Returns `null`. |

#### `describe('isDevEnvironment')`

| # | Test | Assert |
|---|------|--------|
| 3 | returns true for `localhost` | Stub hostname to `'localhost'`. Returns `true`. |
| 4 | returns true for `127.0.0.1` | Stub hostname to `'127.0.0.1'`. Returns `true`. |
| 5 | returns true for `myapp.local` | Stub hostname to `'myapp.local'`. Returns `true`. |
| 6 | returns false for `example.com` | Stub hostname to `'example.com'`. Returns `false`. |
| 7 | returns false when window is undefined (SSR) | Temporarily delete/stub `window`. Returns `false`. |

#### `describe('validateDomainAtRender')`

| # | Test | Assert |
|---|------|--------|
| 8 | returns true when hostname matches activation label | Stub hostname to `'example.com'`. `validateDomainAtRender('example.com')` returns `true`. `console.warn` NOT called. |
| 9 | returns false and logs warning on hostname mismatch | Stub hostname to `'other.com'`. `validateDomainAtRender('example.com')` returns `false`. Assert `console.warn` called once with message containing `'Domain mismatch'`. |
| 10 | warning message includes both domains | Assert `console.warn` message includes `'example.com'` (activation label) and `'other.com'` (current domain). |
| 11 | returns true in SSR (no window) | Temporarily delete/stub `window`. `validateDomainAtRender('example.com')` returns `true`. |
| 12 | returns true in dev environment (skip check) | Stub hostname to `'localhost'`. `validateDomainAtRender('example.com')` returns `true`. `console.warn` NOT called. |
| 13 | returns true for 127.0.0.1 (dev bypass) | Stub hostname to `'127.0.0.1'`. `validateDomainAtRender('production.com')` returns `true`. |

---

## 6. Edge Cases & Boundary Conditions

| Category | Edge Case | Covered In |
|----------|-----------|------------|
| Network | fetch throws TypeError (offline) | polar-client #17 |
| Network | fetch returns non-JSON body | polar-client #3 |
| Cache | Cache entry written 23h59m ago (just within TTL) | cache #3 |
| Cache | Cache entry written 72h01m ago (just past TTL) | cache #4 |
| Cache | localStorage quota exceeded on write | Not tested (writeCache wraps in try/catch, fails silently) |
| Domain | Empty hostname string | Implicitly covered by SSR tests |
| API | Validate returns `disabled` status | Could be added; similar to `revoked` path |
| Orchestrator | Race condition: two validateLicenseKey calls in parallel | Out of scope for Phase 1 (no dedup logic yet) |

---

## 7. What Is NOT Tested (Out of Scope)

| Item | Reason |
|------|--------|
| React components (LicenseProvider, LicenseGate) | Phase 2 scope |
| Real Polar API calls (integration tests) | Phase 0 already validated; unit tests mock fetch |
| tsup bundle output | Verified by build step, not test suite |
| `src/types/index.ts` (type definitions only) | Types are compile-time only; tested implicitly via usage |
| `src/lib/schemas.ts` (Zod schemas) | Tested indirectly through cache and polar-client tests |
| `src/headless.ts` (re-exports) | Tested implicitly; export correctness verified by TypeScript |

---

## 8. Test Execution Commands

```bash
# Run all license tests
pnpm test --filter=@tour-kit/license

# Run specific test file
pnpm test --filter=@tour-kit/license -- polar-client
pnpm test --filter=@tour-kit/license -- cache
pnpm test --filter=@tour-kit/license -- domain

# Run with coverage
pnpm test:coverage --filter=@tour-kit/license

# Watch mode during development
pnpm test:watch --filter=@tour-kit/license
```

---

## 9. Exit Criteria

| # | Criterion | Test File |
|---|-----------|-----------|
| 1 | `validateKey()` returns parsed camelCase response for valid key | polar-client #1 |
| 2 | `validateKey()` throws `PolarApiError` for 404 | polar-client #2 |
| 3 | `validateKey()` throws `PolarParseError` for malformed body | polar-client #3 |
| 4 | `activateKey()` returns activation with correct domain label | polar-client #5 |
| 5 | `activateKey()` throws `PolarApiError` for 403 | polar-client #6 |
| 6 | `deactivateKey()` succeeds on 204 | polar-client #8 |
| 7 | Orchestrator returns cached state on cache hit | polar-client #10 |
| 8 | Orchestrator validates + auto-activates on cache miss | polar-client #11 |
| 9 | Orchestrator returns `revoked` for revoked key | polar-client #13 |
| 10 | Orchestrator returns `expired` for expired key | polar-client #14 |
| 11 | Orchestrator returns `invalid_key` for 404 | polar-client #15 |
| 12 | Orchestrator returns `activation_limit_reached` for 403 | polar-client #16 |
| 13 | Orchestrator returns `network_error` for fetch failure | polar-client #17 |
| 14 | Orchestrator bypasses API in dev environment | polar-client #18 |
| 15 | Cache round-trip preserves state | cache #1 |
| 16 | Cache returns null after TTL expires | cache #4 |
| 17 | Cache clears corrupted JSON entries | cache #6 |
| 18 | Cache clears wrong-shape entries (Zod failure) | cache #7 |
| 19 | Cache functions are SSR-safe | cache #11-13 |
| 20 | `getCurrentDomain()` returns hostname | domain #1 |
| 21 | `isDevEnvironment()` detects localhost, 127.0.0.1, *.local | domain #3-5 |
| 22 | `isDevEnvironment()` returns false for production domains | domain #6 |
| 23 | `validateDomainAtRender()` warns on mismatch | domain #9 |
| 24 | `validateDomainAtRender()` skips check in SSR and dev | domain #11-12 |
| 25 | All 3 test files pass: `pnpm test --filter=@tour-kit/license` exits 0 | All |
| 26 | Coverage >80% of `src/lib/` | `pnpm test:coverage --filter=@tour-kit/license` |
