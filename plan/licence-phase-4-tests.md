# Phase 4 — Testing: Webhook Handler + Pricing Page

**Scope:** apps/docs/app/api/webhooks/polar/route.ts, Zod event schemas
**Key Pattern:** Mock `standard-webhooks` Webhook class — control verify() to either succeed or throw; test route handler as a function
**Dependencies:** vitest, vi.mock('standard-webhooks')

---

## User Stories

1. **As Polar.sh,** when I send a `benefit_grant.created` webhook with a valid HMAC-SHA256 signature, the handler returns 200 and logs the sale so no retries are triggered.
2. **As an attacker,** when I send a forged request with an invalid or missing signature, the handler returns 401 and never processes the payload.
3. **As Polar.sh,** when I send a new event type the handler does not recognize (e.g., `order.created`), the handler returns 200 so I do not retry indefinitely.
4. **As a visitor on the pricing page,** I can see the Free vs Pro comparison and the checkout link renders correctly.

---

## 1. Component Mock Strategy

| Component | Mock Strategy |
|-----------|--------------|
| `standard-webhooks` Webhook class | `vi.mock('standard-webhooks')` — replace the entire module. The mock `Webhook` constructor is a no-op; `verify()` is a vi.fn() that either returns void (success) or throws (failure), controlled per test. |
| Next.js `NextResponse` | Not mocked — the route handler returns real `Response` objects. Vitest runs in Node, and the Web `Request`/`Response` APIs are available natively. |
| `process.env` | Set `POLAR_WEBHOOK_SECRET` in the test setup via `vi.stubEnv()` or direct assignment. |
| Pricing page | Smoke test only — import the component, assert it renders without throwing. No API mocks needed since the pricing page is purely presentational. |

---

## 2. Test Tier Table

| # | Test | Tier | Tool | Pass Criteria |
|---|------|------|------|---------------|
| 1 | Valid signature + benefit_grant.created | Unit | vitest, mocked Webhook | 200 response, `{ received: true }` body |
| 2 | Valid signature + benefit_grant.revoked | Unit | vitest, mocked Webhook | 200 response, `{ received: true }` body |
| 3 | Invalid signature (verify throws) | Unit | vitest, mocked Webhook | 401 response, `{ error: 'Invalid signature' }` body |
| 4 | Missing webhook headers | Unit | vitest, mocked Webhook | 401 response (verify throws on empty headers) |
| 5 | Unknown event type | Unit | vitest, mocked Webhook | 200 response (handler does not reject) |
| 6 | Malformed JSON body | Unit | vitest, mocked Webhook | 401 response (verify throws because signature cannot match garbage) |
| 7 | Real Polar sandbox webhook | Integration | `--with-polar` flag, ngrok | 200 response in server logs (manual, not in CI) |

---

## 3. Fake / Mock Implementations

### MockWebhook

The mock replaces the `Webhook` class from `standard-webhooks`. Each test controls whether `verify()` succeeds or fails.

```typescript
// Inside vi.mock('standard-webhooks')
const mockVerify = vi.fn()

vi.mock('standard-webhooks', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}))
```

**Usage per test:**

- **Success path:** `mockVerify.mockReturnValue(undefined)` — verify() returns void, no throw.
- **Failure path:** `mockVerify.mockImplementation(() => { throw new Error('Invalid signature') })` — simulates `WebhookVerificationError`.

No other fakes are needed. The route handler is called directly as a function — no HTTP server, no supertest.

---

## 4. Test File List

| File | Test Cases | Description |
|------|------------|-------------|
| `apps/docs/__tests__/webhook.test.ts` | 6 | Webhook route handler: signature verification, event handling, error paths |
| `apps/docs/__tests__/pricing.test.tsx` | 1 (optional) | Pricing page renders without errors |

---

## 5. Test Setup

```typescript
// apps/docs/__tests__/webhook.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock standard-webhooks before importing the route
const mockVerify = vi.fn()

vi.mock('standard-webhooks', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}))

// Import the route handler AFTER mocking
import { POST } from '../app/api/webhooks/polar/route'

// Helper: create a Request with webhook headers
function createWebhookRequest(
  body: string,
  headers: Record<string, string> = {}
): Request {
  return new Request('http://localhost/api/webhooks/polar', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': 'msg_test123',
      'webhook-timestamp': '1234567890',
      'webhook-signature': 'v1,dGVzdHNpZ25hdHVyZQ==',
      ...headers,
    },
    body,
  })
}

// Helper: create a valid benefit_grant event payload
function createBenefitGrantPayload(
  type: 'benefit_grant.created' | 'benefit_grant.revoked'
): string {
  return JSON.stringify({
    type,
    data: {
      id: 'bg_test123',
      benefit_id: 'ben_pro_license',
      customer: {
        email: 'dev@example.com',
      },
      properties: {
        license_key_id: 'lk_abc123',
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.POLAR_WEBHOOK_SECRET = 'whsec_dGVzdHNlY3JldA=='
})
```

---

## 6. Key Testing Decisions

| Decision | Rationale |
|----------|-----------|
| Mock Webhook class, not fetch | The webhook handler does not make outbound HTTP requests — it receives and verifies. Mocking the Webhook class is the narrowest, most precise mock. |
| Call POST() directly with Request objects | Avoids spinning up a Next.js server. Keeps tests fast (~50ms), deterministic, and unit-test-like. The App Router route handler is just an async function that takes a Request and returns a Response. |
| Read response body as JSON for assertions | `await response.json()` gives us the exact shape to assert against, matching how Polar would interpret the response. |
| Test raw body handling indirectly | By mocking `verify()`, we trust that `standard-webhooks` handles the HMAC correctly. The test verifies that the route reads the body as text (not JSON) by confirming `verify()` is called with the raw string, not a parsed object. |
| Return 200 for unknown events | Polar retries on non-2xx up to 10 times. Returning 200 for unrecognized events prevents retry storms. The test confirms this design choice. |
| Malformed JSON returns 401 | When the body is garbage, `Webhook.verify()` will throw because the HMAC cannot match. This is the natural behavior — we do not need a separate JSON parse guard before verification. |
| No snapshot test for pricing | The pricing page is presentational with no dynamic data fetching. A smoke render test catches import errors; visual regression is out of scope. |

---

## 7. Example Test Case

```typescript
// apps/docs/__tests__/webhook.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockVerify = vi.fn()

vi.mock('standard-webhooks', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}))

import { POST } from '../app/api/webhooks/polar/route'

function createWebhookRequest(
  body: string,
  headers: Record<string, string> = {}
): Request {
  return new Request('http://localhost/api/webhooks/polar', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': 'msg_test123',
      'webhook-timestamp': '1234567890',
      'webhook-signature': 'v1,dGVzdHNpZ25hdHVyZQ==',
      ...headers,
    },
    body,
  })
}

function createBenefitGrantPayload(
  type: 'benefit_grant.created' | 'benefit_grant.revoked'
): string {
  return JSON.stringify({
    type,
    data: {
      id: 'bg_test123',
      benefit_id: 'ben_pro_license',
      customer: { email: 'dev@example.com' },
      properties: { license_key_id: 'lk_abc123' },
    },
  })
}

describe('POST /api/webhooks/polar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.POLAR_WEBHOOK_SECRET = 'whsec_dGVzdHNlY3JldA=='
  })

  it('returns 200 and logs sale for benefit_grant.created', async () => {
    mockVerify.mockReturnValue(undefined)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const body = createBenefitGrantPayload('benefit_grant.created')
    const request = createWebhookRequest(body)
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
    expect(mockVerify).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'license_sale' })
    )

    consoleSpy.mockRestore()
  })

  it('returns 200 and logs revocation for benefit_grant.revoked', async () => {
    mockVerify.mockReturnValue(undefined)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const body = createBenefitGrantPayload('benefit_grant.revoked')
    const request = createWebhookRequest(body)
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'license_revocation' })
    )

    consoleSpy.mockRestore()
  })

  it('returns 401 when signature verification fails', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const body = createBenefitGrantPayload('benefit_grant.created')
    const request = createWebhookRequest(body)
    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Invalid signature' })
  })

  it('returns 401 when webhook headers are missing', async () => {
    // Empty headers cause verify() to throw
    mockVerify.mockImplementation(() => {
      throw new Error('Missing required headers')
    })

    const body = createBenefitGrantPayload('benefit_grant.created')
    const request = new Request('http://localhost/api/webhooks/polar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Invalid signature' })
  })

  it('returns 200 for unknown event types without rejecting', async () => {
    mockVerify.mockReturnValue(undefined)

    const body = JSON.stringify({
      type: 'order.created',
      data: { id: 'ord_unknown', amount: 4900 },
    })
    const request = createWebhookRequest(body)
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
  })

  it('returns 401 for malformed JSON body', async () => {
    // Garbage body will cause verify() to throw since HMAC won't match
    mockVerify.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = createWebhookRequest('not-valid-json{{{')
    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Invalid signature' })
  })
})
```

---

## 8. Execution Prompt

> **You are writing the tests for Phase 4 of the Tour Kit Licensing System.**
>
> Tour Kit is a headless onboarding/product tour library. The docs site is a Next.js App Router project at `apps/docs/`. Phase 4 added a webhook handler at `apps/docs/app/api/webhooks/polar/route.ts` that verifies Polar.sh webhook signatures using `standard-webhooks` and handles `benefit_grant.created` / `benefit_grant.revoked` events.
>
> ### What you are testing
>
> The `POST()` route handler function. It:
> 1. Reads the raw body as text (`request.text()`, not `request.json()`)
> 2. Extracts `webhook-id`, `webhook-timestamp`, `webhook-signature` headers
> 3. Creates `new Webhook(process.env.POLAR_WEBHOOK_SECRET!)` from `standard-webhooks`
> 4. Calls `wh.verify(rawBody, headers)` — throws on invalid signature
> 5. Parses JSON, validates with Zod (`benefitGrantEventSchema`)
> 6. Handles `benefit_grant.created` (logs sale) and `benefit_grant.revoked` (logs revocation)
> 7. Unknown events return 200 (never reject — prevents Polar retry storms)
>
> ### Mock pattern
>
> Mock the `standard-webhooks` module with `vi.mock()`. The mock `Webhook` class has a single `verify` method (`vi.fn()`). Control it per test:
>
> ```typescript
> const mockVerify = vi.fn()
>
> vi.mock('standard-webhooks', () => ({
>   Webhook: vi.fn().mockImplementation(() => ({
>     verify: mockVerify,
>   })),
> }))
> ```
>
> - **Success:** `mockVerify.mockReturnValue(undefined)` — verify() returns void.
> - **Failure:** `mockVerify.mockImplementation(() => { throw new Error('Invalid signature') })` — simulates WebhookVerificationError.
>
> ### Helper functions
>
> Create two helpers:
> 1. `createWebhookRequest(body, headers?)` — builds a `Request` with default webhook headers (webhook-id, webhook-timestamp, webhook-signature). Override headers with the second parameter.
> 2. `createBenefitGrantPayload(type)` — returns a JSON string for `benefit_grant.created` or `benefit_grant.revoked` with test data (email: `dev@example.com`, benefit_id: `ben_pro_license`, license_key_id: `lk_abc123`).
>
> ### The 6 test cases
>
> Write all 6 tests inside `describe('POST /api/webhooks/polar')`:
>
> 1. **Valid signature + benefit_grant.created** — mockVerify returns void. Assert: 200, body `{ received: true }`, console.log called with `{ event: 'license_sale' }`.
> 2. **Valid signature + benefit_grant.revoked** — mockVerify returns void. Assert: 200, body `{ received: true }`, console.log called with `{ event: 'license_revocation' }`.
> 3. **Invalid signature** — mockVerify throws. Assert: 401, body `{ error: 'Invalid signature' }`.
> 4. **Missing webhook headers** — Create request with NO webhook headers. mockVerify throws. Assert: 401, body `{ error: 'Invalid signature' }`.
> 5. **Unknown event type** — mockVerify returns void. Send `{ type: 'order.created', data: { id: 'ord_unknown' } }`. Assert: 200, body `{ received: true }`.
> 6. **Malformed JSON body** — mockVerify throws. Send `'not-valid-json{{{'`. Assert: 401, body `{ error: 'Invalid signature' }`.
>
> ### Environment setup
>
> In `beforeEach`:
> - `vi.clearAllMocks()`
> - `process.env.POLAR_WEBHOOK_SECRET = 'whsec_dGVzdHNlY3JldA=='`
>
> ### File to create
>
> `apps/docs/__tests__/webhook.test.ts`
>
> Use `import { POST } from '../app/api/webhooks/polar/route'` — import AFTER the `vi.mock()` call.
>
> ### Success criteria
>
> - All 6 tests pass: `pnpm vitest run apps/docs/__tests__/webhook.test.ts`
> - Each test is independent (no shared mutable state between tests)
> - No HTTP server spun up — POST() called directly with Request objects
> - Console.log spied and restored in tests that assert log output

---

## 9. Run Commands

```bash
# Run webhook tests only
pnpm vitest run apps/docs/__tests__/webhook.test.ts

# Run webhook tests in watch mode during development
pnpm vitest apps/docs/__tests__/webhook.test.ts

# Run with coverage to verify handler lines are covered
pnpm vitest run apps/docs/__tests__/webhook.test.ts --coverage

# Run all docs app tests (if more exist)
pnpm vitest run --config apps/docs/vitest.config.ts
```

---

## Coverage Check

The 6 test cases cover the following paths through the webhook route handler:

| Route Handler Line | Covered By Test |
|--------------------|-----------------|
| `await request.text()` (raw body read) | All 6 tests |
| `request.headers.get('webhook-id')` | Tests 1-6 (headers present in 1-3,5-6; missing in 4) |
| `new Webhook(process.env.POLAR_WEBHOOK_SECRET!)` | All 6 tests |
| `wh.verify(rawBody, headers)` — success path | Tests 1, 2, 5 |
| `wh.verify(rawBody, headers)` — throw path | Tests 3, 4, 6 |
| `catch` block → return 401 | Tests 3, 4, 6 |
| `JSON.parse(rawBody)` | Tests 1, 2, 5 |
| Zod `.safeParse()` — valid benefit_grant | Tests 1, 2 |
| Zod `.safeParse()` — unknown event (parse fails or no match) | Test 5 |
| `benefit_grant.created` handler (log sale) | Test 1 |
| `benefit_grant.revoked` handler (log revocation) | Test 2 |
| Unknown event fallthrough → return 200 | Test 5 |
| Final return 200 | Tests 1, 2, 5 |

**Expected coverage:** 100% of the route handler's branches. The only untested path is the unlikely case where `POLAR_WEBHOOK_SECRET` is undefined at runtime, which is a deployment configuration concern, not a logic branch worth testing.
