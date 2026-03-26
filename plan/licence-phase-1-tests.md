# Phase 1 — Testing: Core License SDK

**Scope:** `src/lib/polar-client.ts`, `src/lib/cache.ts`, `src/lib/domain.ts`, `src/lib/schemas.ts`, `src/types/index.ts`
**Key Pattern:** Mock global `fetch()` for all Polar API calls; mock `localStorage` for cache tests; no network calls in unit tests
**Dependencies:** vitest, `vi.fn()` for fetch mocking

---

## User Stories

| # | Story | Tested In |
|---|-------|-----------|
| US-1 | As a developer, I can call `validateLicenseKey()` with a valid Polar key and receive a `LicenseState` with `valid: true`, `tier: 'pro'`, and `status: 'granted'` — so my app knows the license is good. | `polar-client.test.ts` |
| US-2 | As a developer, repeated calls to `validateLicenseKey()` within 24 hours hit the localStorage cache instead of the Polar API — so I do not get rate-limited and page loads stay fast. | `cache.test.ts`, `polar-client.test.ts` |
| US-3 | As a developer working on localhost, `isDevEnvironment()` returns `true` — so I am never charged an activation slot during development. | `domain.test.ts` |
| US-4 | As a developer, when the Polar API returns a network error or an unexpected response shape, `validateLicenseKey()` returns a structured `LicenseError` with the correct `code` — so I can display an appropriate message. | `polar-client.test.ts` |
| US-5 | As a developer, if Polar changes their response shape, the Zod schema rejects the malformed response and `validateLicenseKey()` returns `{ code: 'INVALID_RESPONSE' }` — so I catch API drift early. | `schemas.test.ts`, `polar-client.test.ts` |

---

## 1. Component Mock Strategy

| Module | Mock Approach | Reason |
|--------|--------------|--------|
| `polar-client.ts` | Mock `globalThis.fetch` via `vi.fn()` | All 3 Polar endpoints use `fetch()`. Mocking at the global level lets us test the full request construction (URL, headers, body) and response parsing without touching the network. |
| `cache.ts` | Mock `globalThis.localStorage` with an in-memory `Map`-backed object | Cache reads/writes target `localStorage`. A fake implementation with `getItem`, `setItem`, `removeItem` gives full control over stored data and avoids jsdom quirks. Also mock `Date.now()` via `vi.spyOn` for TTL tests. |
| `domain.ts` | Mock `globalThis.window.location` by assigning a custom object | `getCurrentDomain()` reads `window.location.hostname`. Overriding the property lets us parametrize across hostnames without jsdom navigation. |
| `schemas.ts` | No mocks | Pure Zod schema validation — pass in raw objects, assert `safeParse` success/failure. Zero side effects. |

---

## 2. Test Tier Table

| Tier | What It Covers | Mocks | When to Run |
|------|---------------|-------|-------------|
| **Unit** | All 4 test files. Every public function in `polar-client`, `cache`, `domain`, `schemas`. | `fetch`, `localStorage`, `window.location`, `Date.now()` | `pnpm test --filter=@tour-kit/license` — every CI push |
| **Integration** (optional) | Real Polar sandbox API calls. Validate → activate → deactivate round-trip. | None — real network | `pnpm test --filter=@tour-kit/license -- --with-polar` — gated behind `POLAR_TEST_KEY` and `POLAR_TEST_ORG_ID` env vars. Manual / nightly only. |

**Note:** Integration tests are out of scope for this phase. They exist in Phase 0's validation script (`scripts/polar-validation-test.ts`). Phase 1 tests are 100% unit tests with mocked `fetch`.

---

## 3. Fake / Mock Implementations

### MockFetch

```typescript
/**
 * Creates a vi.fn() that replaces globalThis.fetch.
 * Returns a builder for chaining endpoint-specific responses.
 */
function createMockFetch() {
  const mockFn = vi.fn<typeof fetch>();

  return {
    fn: mockFn,

    /** Return a successful JSON response for the next call */
    respondWith(body: unknown, status = 200) {
      mockFn.mockResolvedValueOnce(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      return this;
    },

    /** Return a 204 No Content (for deactivate) */
    respondNoContent() {
      mockFn.mockResolvedValueOnce(new Response(null, { status: 204 }));
      return this;
    },

    /** Simulate a network failure */
    respondNetworkError(message = 'Failed to fetch') {
      mockFn.mockRejectedValueOnce(new TypeError(message));
      return this;
    },

    /** Return a non-JSON error body (e.g., Polar 403) */
    respondError(body: unknown, status: number) {
      mockFn.mockResolvedValueOnce(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      return this;
    },

    /** Install as globalThis.fetch, return cleanup fn */
    install() {
      const original = globalThis.fetch;
      globalThis.fetch = mockFn as unknown as typeof fetch;
      return () => { globalThis.fetch = original; };
    },
  };
}
```

### MockLocalStorage

```typescript
/**
 * In-memory localStorage drop-in.
 * Tracks all calls for assertion.
 */
function createMockLocalStorage() {
  const store = new Map<string, string>();

  const mock: Storage = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key: string) { return store.get(key) ?? null; },
    key(index: number) { return [...store.keys()][index] ?? null; },
    removeItem(key: string) { store.delete(key); },
    setItem(key: string, value: string) { store.set(key, value); },
  };

  return {
    storage: mock,
    store, // direct access for assertions
    install() {
      const original = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: mock,
        writable: true,
        configurable: true,
      });
      return () => {
        Object.defineProperty(globalThis, 'localStorage', {
          value: original,
          writable: true,
          configurable: true,
        });
      };
    },
  };
}
```

### Polar Response Fixtures

```typescript
/** Valid Polar validate response fixture */
const VALID_VALIDATE_RESPONSE = {
  id: 'lk_test_123',
  organization_id: 'org_test_456',
  user_id: 'user_789',
  customer: {
    id: 'cust_test',
    email: 'dev@example.com',
    created_at: '2026-01-01T00:00:00Z',
  },
  benefit_id: 'ben_test',
  key: 'TOURKIT_test-key-uuid',
  display_key: 'TOURKIT_****-uuid',
  status: 'granted',
  limit_activations: 5,
  usage: 0,
  limit_usage: null,
  validations: 42,
  last_validated_at: '2026-03-26T12:00:00Z',
  expires_at: null,
  activation: null,
};

/** Valid Polar activate response fixture */
const VALID_ACTIVATE_RESPONSE = {
  id: 'act_test_001',
  license_key_id: 'lk_test_123',
  label: 'example.com',
  meta: {},
  created_at: '2026-03-26T12:00:00Z',
  modified_at: null,
};

/** Revoked key validate response fixture */
const REVOKED_VALIDATE_RESPONSE = {
  ...VALID_VALIDATE_RESPONSE,
  status: 'revoked',
};
```

---

## 4. Test File List

| File | Module Under Test | Test Count (est.) | Priority |
|------|-------------------|-------------------|----------|
| `src/__tests__/polar-client.test.ts` | `src/lib/polar-client.ts` | 18–22 | P0 — most logic lives here |
| `src/__tests__/cache.test.ts` | `src/lib/cache.ts` | 10–12 | P0 — TTL correctness is critical |
| `src/__tests__/domain.test.ts` | `src/lib/domain.ts` | 8–10 | P1 — small surface, parametrized |
| `src/__tests__/schemas.test.ts` | `src/lib/schemas.ts` | 8–10 | P1 — pure validation, no mocks |

**Total estimated tests:** 44–54

---

## 5. Test Setup (vitest)

The package already has a vitest setup via `package.json` scripts. Each test file manages its own mocks in `beforeEach` / `afterEach`. A shared setup file is optional but recommended for the `MockFetch` and `MockLocalStorage` helpers.

### Recommended setup file: `src/__tests__/helpers.ts`

```typescript
// src/__tests__/helpers.ts
// Re-export createMockFetch, createMockLocalStorage, and all fixtures
// so test files stay DRY.

export { createMockFetch } from './mocks/mock-fetch';
export { createMockLocalStorage } from './mocks/mock-local-storage';
export {
  VALID_VALIDATE_RESPONSE,
  VALID_ACTIVATE_RESPONSE,
  REVOKED_VALIDATE_RESPONSE,
} from './fixtures/polar-responses';
```

### Environment

- `vitest` with default `node` environment (not `jsdom`) — we mock `window` and `localStorage` explicitly
- No `setupFiles` in vitest config — each test controls its own lifecycle
- `vi.useFakeTimers()` for cache TTL tests, `vi.useRealTimers()` in `afterEach`

### Environment variables for optional integration tests

```bash
# Only needed for --with-polar integration tests (out of scope for Phase 1)
POLAR_TEST_KEY=TOURKIT_your-sandbox-key
POLAR_TEST_ORG_ID=org_your-sandbox-org
```

---

## 6. Key Testing Decisions

| Decision | Why |
|----------|-----|
| Mock `globalThis.fetch`, not the `polar-client` module | Tests must verify the full request construction (URL, method, headers, body JSON) and response parsing. Mocking at the module boundary would skip all of that. |
| Test Zod schemas in a dedicated file, not only through `polar-client` | Schemas are a contract with the Polar API. If Polar changes their response shape, `schemas.test.ts` should break immediately with a clear error — without needing to debug through the orchestrator. |
| Parametrize domain detection with `it.each()` | 8+ hostname variations (`localhost`, `127.0.0.1`, `0.0.0.0`, `app.local`, `myapp.test`, `192.168.1.1`, `example.com`, `localhost.example.com`) map to a truth table. Parametrization avoids 8 near-identical test bodies. |
| Mock `Date.now()` for cache TTL, not `setTimeout` | Cache TTL is checked by comparing `Date.now() - timestamp > TTL`. Controlling `Date.now()` via `vi.spyOn(Date, 'now')` is simpler and more reliable than advancing fake timers. |
| Use `Response` constructor in MockFetch, not plain objects | `polar-client.ts` calls `response.ok`, `response.status`, `response.json()`. A real `Response` object ensures we test against the actual Fetch API interface, not a lookalike. |
| Keep unit and integration tiers strictly separate | Unit tests run in CI on every push (fast, deterministic). Integration tests hit the real Polar sandbox and require secrets — they run manually or in a nightly job. Mixing them creates flaky CI. |

---

## 7. Example Test Case

### `src/__tests__/polar-client.test.ts` — Full Reference

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module Under Test ───
import {
  validateKey,
  activateKey,
  deactivateKey,
  validateLicenseKey,
} from '../lib/polar-client';

// ─── Helpers (inline for this reference; extract to helpers.ts in real code) ───

function createMockFetch() {
  const mockFn = vi.fn<typeof fetch>();
  return {
    fn: mockFn,
    respondWith(body: unknown, status = 200) {
      mockFn.mockResolvedValueOnce(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      return this;
    },
    respondNoContent() {
      mockFn.mockResolvedValueOnce(new Response(null, { status: 204 }));
      return this;
    },
    respondNetworkError(msg = 'Failed to fetch') {
      mockFn.mockRejectedValueOnce(new TypeError(msg));
      return this;
    },
    respondError(body: unknown, status: number) {
      mockFn.mockResolvedValueOnce(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      return this;
    },
  };
}

// ─── Fixtures ───

const POLAR_ORG_ID = 'org_test_456';
const POLAR_KEY = 'TOURKIT_test-key-uuid';

const VALID_VALIDATE_RESPONSE = {
  id: 'lk_test_123',
  organization_id: POLAR_ORG_ID,
  user_id: 'user_789',
  customer: {
    id: 'cust_test',
    email: 'dev@example.com',
    created_at: '2026-01-01T00:00:00Z',
  },
  benefit_id: 'ben_test',
  key: POLAR_KEY,
  display_key: 'TOURKIT_****-uuid',
  status: 'granted',
  limit_activations: 5,
  usage: 0,
  limit_usage: null,
  validations: 42,
  last_validated_at: '2026-03-26T12:00:00Z',
  expires_at: null,
  activation: null,
};

const VALID_ACTIVATE_RESPONSE = {
  id: 'act_test_001',
  license_key_id: 'lk_test_123',
  label: 'example.com',
  meta: {},
  created_at: '2026-03-26T12:00:00Z',
  modified_at: null,
};

// ─── Setup / Teardown ───

let mockFetch: ReturnType<typeof createMockFetch>;
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  mockFetch = createMockFetch();
  originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch.fn as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// validateKey()
// ═══════════════════════════════════════════════════════════════

describe('validateKey()', () => {
  it('sends correct POST request to Polar validate endpoint', async () => {
    mockFetch.respondWith(VALID_VALIDATE_RESPONSE);

    await validateKey(POLAR_KEY, POLAR_ORG_ID);

    expect(mockFetch.fn).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.fn.mock.calls[0];
    expect(url).toContain('/v1/customer-portal/license-keys/validate');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      key: POLAR_KEY,
      organization_id: POLAR_ORG_ID,
    });
  });

  it('returns parsed ValidatedLicenseKey on success', async () => {
    mockFetch.respondWith(VALID_VALIDATE_RESPONSE);

    const result = await validateKey(POLAR_KEY, POLAR_ORG_ID);

    expect(result.status).toBe('granted');
    expect(result.id).toBe('lk_test_123');
    expect(result.limit_activations).toBe(5);
  });

  it('returns revoked status for revoked key', async () => {
    mockFetch.respondWith({ ...VALID_VALIDATE_RESPONSE, status: 'revoked' });

    const result = await validateKey(POLAR_KEY, POLAR_ORG_ID);

    expect(result.status).toBe('revoked');
  });

  it('throws NETWORK_ERROR when fetch rejects', async () => {
    mockFetch.respondNetworkError();

    await expect(validateKey(POLAR_KEY, POLAR_ORG_ID)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('throws INVALID_RESPONSE when Polar returns non-JSON', async () => {
    mockFetch.fn.mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 })
    );

    await expect(validateKey(POLAR_KEY, POLAR_ORG_ID)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('throws INVALID_RESPONSE when response fails Zod schema', async () => {
    mockFetch.respondWith({ unexpected: 'shape' });

    await expect(validateKey(POLAR_KEY, POLAR_ORG_ID)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// activateKey()
// ═══════════════════════════════════════════════════════════════

describe('activateKey()', () => {
  it('sends correct POST request to Polar activate endpoint', async () => {
    mockFetch.respondWith(VALID_ACTIVATE_RESPONSE);

    await activateKey(POLAR_KEY, POLAR_ORG_ID, 'example.com');

    const [url, init] = mockFetch.fn.mock.calls[0];
    expect(url).toContain('/v1/customer-portal/license-keys/activate');
    expect(JSON.parse(init?.body as string)).toEqual({
      key: POLAR_KEY,
      organization_id: POLAR_ORG_ID,
      label: 'example.com',
    });
  });

  it('returns activation with id on success', async () => {
    mockFetch.respondWith(VALID_ACTIVATE_RESPONSE);

    const result = await activateKey(POLAR_KEY, POLAR_ORG_ID, 'example.com');

    expect(result.id).toBe('act_test_001');
    expect(result.label).toBe('example.com');
  });

  it('throws ACTIVATION_LIMIT when Polar returns 403', async () => {
    mockFetch.respondError(
      { type: 'NotPermitted', detail: 'Activation limit reached' },
      403
    );

    await expect(
      activateKey(POLAR_KEY, POLAR_ORG_ID, 'example.com')
    ).rejects.toMatchObject({
      code: 'ACTIVATION_LIMIT',
    });
  });

  it('throws NETWORK_ERROR when fetch rejects', async () => {
    mockFetch.respondNetworkError();

    await expect(
      activateKey(POLAR_KEY, POLAR_ORG_ID, 'example.com')
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// deactivateKey()
// ═══════════════════════════════════════════════════════════════

describe('deactivateKey()', () => {
  it('sends correct POST request to Polar deactivate endpoint', async () => {
    mockFetch.respondNoContent();

    await deactivateKey(POLAR_KEY, POLAR_ORG_ID, 'act_test_001');

    const [url, init] = mockFetch.fn.mock.calls[0];
    expect(url).toContain('/v1/customer-portal/license-keys/deactivate');
    expect(JSON.parse(init?.body as string)).toEqual({
      key: POLAR_KEY,
      organization_id: POLAR_ORG_ID,
      activation_id: 'act_test_001',
    });
  });

  it('resolves successfully on 204 response', async () => {
    mockFetch.respondNoContent();

    await expect(
      deactivateKey(POLAR_KEY, POLAR_ORG_ID, 'act_test_001')
    ).resolves.not.toThrow();
  });

  it('throws NETWORK_ERROR when fetch rejects', async () => {
    mockFetch.respondNetworkError();

    await expect(
      deactivateKey(POLAR_KEY, POLAR_ORG_ID, 'act_test_001')
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// validateLicenseKey() — orchestrator
// ═══════════════════════════════════════════════════════════════

describe('validateLicenseKey() orchestrator', () => {
  // Mock localStorage + domain for orchestrator tests
  let cleanupStorage: () => void;

  beforeEach(() => {
    const store = new Map<string, string>();
    const mockStorage: Storage = {
      get length() { return store.size; },
      clear() { store.clear(); },
      getItem(key: string) { return store.get(key) ?? null; },
      key(index: number) { return [...store.keys()][index] ?? null; },
      removeItem(key: string) { store.delete(key); },
      setItem(key: string, value: string) { store.set(key, value); },
    };
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    cleanupStorage = () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: original,
        writable: true,
        configurable: true,
      });
    };
  });

  afterEach(() => {
    cleanupStorage();
  });

  it('returns valid LicenseState for a granted key', async () => {
    mockFetch.respondWith(VALID_VALIDATE_RESPONSE);

    const state = await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(state).toMatchObject({
      valid: true,
      tier: 'pro',
      status: 'granted',
    });
  });

  it('returns invalid LicenseState for a revoked key', async () => {
    mockFetch.respondWith({ ...VALID_VALIDATE_RESPONSE, status: 'revoked' });

    const state = await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(state).toMatchObject({
      valid: false,
      status: 'revoked',
    });
  });

  it('uses cached result on second call within TTL', async () => {
    // First call hits the API
    mockFetch.respondWith(VALID_VALIDATE_RESPONSE);

    await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(mockFetch.fn).toHaveBeenCalledOnce();

    // Second call should use cache — no additional fetch
    const state = await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(mockFetch.fn).toHaveBeenCalledOnce(); // still 1
    expect(state.valid).toBe(true);
  });

  it('re-validates after cache TTL expires', async () => {
    const now = 1711454400000; // fixed timestamp
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // First call
    mockFetch.respondWith(VALID_VALIDATE_RESPONSE);
    await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    // Advance past 24h TTL
    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 + 1);

    // Second call should hit API again
    mockFetch.respondWith(VALID_VALIDATE_RESPONSE);
    await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(mockFetch.fn).toHaveBeenCalledTimes(2);
  });

  it('returns NETWORK_ERROR LicenseError when Polar is unreachable', async () => {
    mockFetch.respondNetworkError();

    const state = await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(state.valid).toBe(false);
    // The orchestrator should catch the error and return a structured result
  });

  it('auto-activates for a new domain when activation is null', async () => {
    // validate returns no activation
    mockFetch.respondWith({ ...VALID_VALIDATE_RESPONSE, activation: null });
    // activate succeeds
    mockFetch.respondWith(VALID_ACTIVATE_RESPONSE);

    const state = await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(state.valid).toBe(true);
    expect(state.activationId).toBe('act_test_001');
    expect(mockFetch.fn).toHaveBeenCalledTimes(2);
  });

  it('skips activation when existing activation matches current domain', async () => {
    mockFetch.respondWith({
      ...VALID_VALIDATE_RESPONSE,
      activation: { id: 'act_existing', label: 'example.com' },
    });

    const state = await validateLicenseKey({
      key: POLAR_KEY,
      organizationId: POLAR_ORG_ID,
    });

    expect(state.activationId).toBe('act_existing');
    expect(mockFetch.fn).toHaveBeenCalledOnce(); // no activate call
  });
});
```

---

## 8. Execution Prompt

Use the following self-contained prompt to generate all 4 test files:

> **Context:**
> You are implementing unit tests for the `@tour-kit/license` package (Phase 1 of the licensing system). The package validates Polar.sh license keys via raw `fetch()`, caches results in `localStorage` with a 24h TTL, and detects dev environments to skip activation.
>
> **Files to test:**
> - `src/lib/polar-client.ts` — exports `validateKey()`, `activateKey()`, `deactivateKey()`, `validateLicenseKey()`
> - `src/lib/cache.ts` — exports `readCache()`, `writeCache()`, `clearCache()` with 24h TTL and domain-scoped localStorage keys
> - `src/lib/domain.ts` — exports `getCurrentDomain()`, `isDevEnvironment()`
> - `src/lib/schemas.ts` — exports Zod schemas: `ValidatedLicenseKeySchema`, `LicenseKeyActivationSchema`
>
> **Types:** `LicenseState` (`valid`, `tier`, `activationId`, `expiresAt`, `status`), `LicenseError` (`code`: `NETWORK_ERROR | VALIDATION_FAILED | ACTIVATION_LIMIT | INVALID_RESPONSE`, `message`), `LicenseCache` (`state`, `timestamp`, `domain`)
>
> **Test framework:** Vitest. Mock `globalThis.fetch` with `vi.fn()`. Mock `localStorage` with an in-memory Map. Mock `Date.now()` with `vi.spyOn`. Mock `window.location.hostname` for domain tests. Use `it.each()` for parametrized tests.
>
> **Polar API contracts:**
> - `POST /v1/customer-portal/license-keys/validate` — body `{ key, organization_id }` → `ValidatedLicenseKey` (fields: `id`, `status`, `limit_activations`, `expires_at`, `activation`, `customer`)
> - `POST /v1/customer-portal/license-keys/activate` — body `{ key, organization_id, label }` → `LicenseKeyActivationRead` (fields: `id`, `license_key_id`, `label`, `meta`). 403 when limit reached.
> - `POST /v1/customer-portal/license-keys/deactivate` — body `{ key, organization_id, activation_id }` → 204 No Content
>
> **Write these 4 test files:**
> 1. `src/__tests__/polar-client.test.ts` — 18+ tests covering: request construction, happy paths, error codes, Zod rejection, orchestrator cache integration, auto-activation logic
> 2. `src/__tests__/cache.test.ts` — 10+ tests covering: write then read, TTL expiry, domain-scoped keys, clearCache, corrupted JSON handling, missing localStorage graceful fallback
> 3. `src/__tests__/domain.test.ts` — 8+ tests covering: `getCurrentDomain()` returns hostname, `isDevEnvironment()` parametrized with `it.each` for `localhost`→true, `127.0.0.1`→true, `0.0.0.0`→true, `app.local`→true, `myapp.test`→true, `192.168.1.1`→true, `example.com`→false, `localhost.example.com`→false
> 4. `src/__tests__/schemas.test.ts` — 8+ tests covering: valid validate response parses, valid activate response parses, missing required fields fail, extra fields pass (Zod strip), wrong `status` enum fails, null `activation` is allowed, wrong types fail
>
> **Constraints:** No network calls. No `jsdom` environment — mock globals directly. Every test file must clean up mocks in `afterEach`. Use the `createMockFetch` and `createMockLocalStorage` helpers defined in the test plan.

---

## 9. Run Commands

```bash
# Run all Phase 1 license tests
pnpm test --filter=@tour-kit/license

# Run a specific test file
pnpm test --filter=@tour-kit/license -- polar-client
pnpm test --filter=@tour-kit/license -- cache
pnpm test --filter=@tour-kit/license -- domain
pnpm test --filter=@tour-kit/license -- schemas

# Run with coverage report
pnpm test:coverage --filter=@tour-kit/license

# Watch mode during development
pnpm --filter=@tour-kit/license test:watch
```

---

## Coverage Check

| # | Item | Target | Status |
|---|------|--------|--------|
| CC-1 | `validateKey()` — happy path, revoked, network error, invalid JSON, Zod rejection | 5 cases | PASS when implemented |
| CC-2 | `activateKey()` — happy path, 403 limit, network error | 3 cases | PASS when implemented |
| CC-3 | `deactivateKey()` — 204 success, network error | 2 cases | PASS when implemented |
| CC-4 | `validateLicenseKey()` — granted, revoked, cache hit, cache miss after TTL, auto-activate, skip activate, network error fallback | 7 cases | PASS when implemented |
| CC-5 | `readCache()` — hit, miss, expired, wrong domain, corrupted JSON | 5 cases | PASS when implemented |
| CC-6 | `writeCache()` — stores correct shape, domain-scoped key | 2 cases | PASS when implemented |
| CC-7 | `clearCache()` — removes entry, no-op when missing | 2 cases | PASS when implemented |
| CC-8 | `getCurrentDomain()` — returns hostname, returns null in non-browser | 2 cases | PASS when implemented |
| CC-9 | `isDevEnvironment()` — 8-row truth table (6 true, 2 false) | 8 cases | PASS when implemented |
| CC-10 | `ValidatedLicenseKeySchema` — valid parse, missing fields, wrong enum, null activation | 4 cases | PASS when implemented |
| CC-11 | `LicenseKeyActivationSchema` — valid parse, missing fields, wrong types | 3 cases | PASS when implemented |
| CC-12 | Overall line coverage for `src/lib/` | > 80% | PASS when all above pass |
| CC-13 | Zero `fetch()` calls escape to network | 0 real calls | PASS — `globalThis.fetch` is always mocked |
| CC-14 | All test files clean up mocks in `afterEach` | No leaked state | PASS — verify via `--sequence.shuffle` |
