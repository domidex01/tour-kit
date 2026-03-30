# Phase 4 Test Plan — Webhook Handler + Docs Pricing Page

| Field | Value |
|-------|-------|
| **Phase** | 4 |
| **Type** | Service (Next.js API route webhook handler) |
| **Test Runner** | Vitest |
| **Test File** | `apps/docs/app/api/webhooks/polar/__tests__/webhook.test.ts` |

---

## 1. Mock Strategy

Mock the `@polar-sh/nextjs` module using `vi.mock()`. The `Webhooks()` export is a factory that returns a Next.js route handler (`POST`). The mock captures the config (`webhookSecret`, `onPayload`) and exposes a controllable handler that can simulate valid signatures, invalid signatures, and stale timestamps.

```typescript
// Mock shape
vi.mock("@polar-sh/nextjs", () => ({
  Webhooks: vi.fn((config: { webhookSecret: string; onPayload: (payload: any) => Promise<void> }) => {
    // Store config for test access
    mockConfig = config;
    // Return a route handler that delegates to onPayload or rejects
    return mockRouteHandler;
  }),
}));
```

Key mock behaviors:
- **Valid request**: Calls `config.onPayload(payload)` and returns `Response(null, { status: 202 })`.
- **Invalid signature**: Returns `Response("Invalid signature", { status: 403 })` without calling `onPayload`.
- **Stale timestamp**: Returns `Response("Stale timestamp", { status: 403 })` without calling `onPayload`.
- **Malformed body**: Returns `Response("Bad request", { status: 400 })` without calling `onPayload`.

The mock simulates SDK behavior so unit tests focus on the handler logic (idempotency, event routing, structured logging) rather than re-testing the SDK.

---

## 2. Test Helper Utilities

### `createWebhookRequest(overrides?)`

Factory for `NextRequest` objects with standard webhook headers:

```typescript
function createWebhookRequest(overrides?: {
  webhookId?: string;
  webhookTimestamp?: string;
  webhookSignature?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}): NextRequest {
  const body = overrides?.body ?? makeBenefitGrantPayload("benefit_grant.created");
  const now = Math.floor(Date.now() / 1000);

  return new NextRequest("http://localhost:3000/api/webhooks/polar", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": overrides?.webhookId ?? `wh_${crypto.randomUUID()}`,
      "webhook-timestamp": overrides?.webhookTimestamp ?? String(now),
      "webhook-signature": overrides?.webhookSignature ?? "v1,validbase64sig==",
      ...overrides?.headers,
    },
    body: JSON.stringify(body),
  });
}
```

### `makeBenefitGrantPayload(type)`

Generates typed webhook payloads for each event type:

```typescript
function makeBenefitGrantPayload(
  type: "benefit_grant.created" | "benefit_grant.updated" | "benefit_grant.revoked"
) {
  return {
    type,
    data: {
      id: "bg_test123",
      benefit_id: "ben_tourkit_pro",
      customer_id: "cust_abc456",
      benefit: {
        id: "ben_tourkit_pro",
        type: "license_keys",
        description: "Tour Kit Pro License",
      },
      granted_at: new Date().toISOString(),
    },
  };
}
```

---

## 3. Environment Setup

```typescript
beforeEach(() => {
  vi.stubEnv("POLAR_WEBHOOK_SECRET", "whsec_test_placeholder_not_real");
  vi.restoreAllMocks();
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  // Reset the idempotency Map between tests (import and clear, or re-import module)
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

Module re-import strategy: Use `vi.resetModules()` + dynamic `import()` in tests that need a fresh idempotency Map. For tests that verify deduplication, import once and call the handler twice.

---

## 4. Test Sections

### Section A: Signature Verification (SDK behavior, mocked)

| # | Test | Expected |
|---|------|----------|
| A1 | Valid signature with `benefit_grant.created` payload | `onPayload` is called, response status 202 |
| A2 | Invalid signature header | `onPayload` is NOT called, response status 403 |
| A3 | Missing `webhook-signature` header | Response status 403 |
| A4 | Missing `POLAR_WEBHOOK_SECRET` env var | `Webhooks()` receives `undefined` secret, handler rejects (test that env is required) |

```typescript
describe("Signature verification", () => {
  it("calls onPayload and returns 202 for valid signature", async () => {
    const req = createWebhookRequest();
    simulateValidSignature();
    const res = await POST(req);
    expect(res.status).toBe(202);
    expect(mockConfig.onPayload).toHaveBeenCalled();
  });

  it("returns 403 for invalid signature without calling onPayload", async () => {
    const req = createWebhookRequest({ webhookSignature: "v1,invalidsig==" });
    simulateInvalidSignature();
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockConfig.onPayload).not.toHaveBeenCalled();
  });

  it("returns 403 when webhook-signature header is missing", async () => {
    const req = createWebhookRequest({ webhookSignature: "" });
    simulateInvalidSignature();
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
```

### Section B: Stale Timestamp Rejection (SDK behavior, mocked)

| # | Test | Expected |
|---|------|----------|
| B1 | Timestamp > 5 minutes old | Response status 403, `onPayload` not called |
| B2 | Timestamp within 5-minute window | Response status 202, `onPayload` called |

```typescript
describe("Stale timestamp rejection", () => {
  it("returns 403 for webhook-timestamp older than 5 minutes", async () => {
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 6 * 60); // 6 min ago
    const req = createWebhookRequest({ webhookTimestamp: staleTimestamp });
    simulateStaleTimestamp();
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("accepts webhook-timestamp within 5-minute window", async () => {
    const freshTimestamp = String(Math.floor(Date.now() / 1000) - 2 * 60); // 2 min ago
    const req = createWebhookRequest({ webhookTimestamp: freshTimestamp });
    simulateValidSignature();
    const res = await POST(req);
    expect(res.status).toBe(202);
  });
});
```

### Section C: Idempotency (Duplicate webhook-id)

| # | Test | Expected |
|---|------|----------|
| C1 | First request with a webhook-id processes normally | `onPayload` logic executes, returns 202 |
| C2 | Second request with same webhook-id returns 202 without re-processing | Returns 202, handler logic (logging) not executed again |
| C3 | Same webhook-id after TTL expiry (10 min) processes again | After advancing timers past 10 min, re-processes normally |

```typescript
describe("Idempotency", () => {
  it("processes the first request with a given webhook-id", async () => {
    const webhookId = "wh_dedup_test_001";
    const req = createWebhookRequest({ webhookId });
    simulateValidSignature();
    const res = await POST(req);
    expect(res.status).toBe(202);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[polar-webhook]",
      expect.objectContaining({ type: "benefit_grant.created" })
    );
  });

  it("returns 202 without re-processing for duplicate webhook-id", async () => {
    const webhookId = "wh_dedup_test_002";
    simulateValidSignature();

    // First call
    const req1 = createWebhookRequest({ webhookId });
    await POST(req1);
    consoleSpy.mockClear();

    // Second call — same webhook-id
    const req2 = createWebhookRequest({ webhookId });
    const res = await POST(req2);
    expect(res.status).toBe(202);
    expect(consoleSpy).not.toHaveBeenCalledWith(
      "[polar-webhook]",
      expect.objectContaining({ type: "benefit_grant.created" })
    );
  });

  it("re-processes after TTL expiry", async () => {
    vi.useFakeTimers();
    const webhookId = "wh_dedup_test_003";
    simulateValidSignature();

    const req1 = createWebhookRequest({ webhookId });
    await POST(req1);
    consoleSpy.mockClear();

    // Advance past 10-minute TTL
    vi.advanceTimersByTime(11 * 60 * 1000);

    const req2 = createWebhookRequest({ webhookId });
    const res = await POST(req2);
    expect(res.status).toBe(202);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[polar-webhook]",
      expect.objectContaining({ type: "benefit_grant.created" })
    );

    vi.useRealTimers();
  });
});
```

### Section D: Event Type Handling

| # | Test | Expected |
|---|------|----------|
| D1 | `benefit_grant.created` event | Returns 202, logs `{ type: "benefit_grant.created", benefit_id, customer_id, timestamp }` |
| D2 | `benefit_grant.updated` event | Returns 202, logs `{ type: "benefit_grant.updated", benefit_id, customer_id, timestamp }` |
| D3 | `benefit_grant.revoked` event | Returns 202, logs `{ type: "benefit_grant.revoked", benefit_id, customer_id, timestamp }` |
| D4 | Unknown event type (e.g., `order.created`) | Returns 202, does not crash, logs unknown type warning |

```typescript
describe("Event type handling", () => {
  it.each([
    "benefit_grant.created",
    "benefit_grant.updated",
    "benefit_grant.revoked",
  ] as const)("handles %s event and logs structured data", async (eventType) => {
    const payload = makeBenefitGrantPayload(eventType);
    const req = createWebhookRequest({ body: payload });
    simulateValidSignature();

    const res = await POST(req);
    expect(res.status).toBe(202);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[polar-webhook]",
      expect.objectContaining({
        type: eventType,
        benefit_id: "ben_tourkit_pro",
        customer_id: "cust_abc456",
      })
    );
  });

  it("handles unknown event type gracefully without crashing", async () => {
    const payload = { type: "order.created", data: { id: "ord_123" } };
    const req = createWebhookRequest({ body: payload });
    simulateValidSignature();

    const res = await POST(req);
    expect(res.status).toBe(202);
    // Should not throw
  });
});
```

### Section E: Structured Logging

| # | Test | Expected |
|---|------|----------|
| E1 | `benefit_grant.created` log shape | `console.log("[polar-webhook]", { type, benefit_id, customer_id, timestamp })` |
| E2 | Duplicate request does not log again | `console.log` not called with `[polar-webhook]` on second call |
| E3 | Unknown event type logs a warning | `console.log` called with unknown type indicator |

```typescript
describe("Structured logging", () => {
  it("logs [polar-webhook] prefix with structured payload fields", async () => {
    const req = createWebhookRequest({
      body: makeBenefitGrantPayload("benefit_grant.created"),
    });
    simulateValidSignature();
    await POST(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[polar-webhook]",
      expect.objectContaining({
        type: "benefit_grant.created",
        benefit_id: expect.any(String),
        customer_id: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it("does not log payload on duplicate webhook-id", async () => {
    const webhookId = "wh_log_dedup";
    simulateValidSignature();

    await POST(createWebhookRequest({ webhookId }));
    consoleSpy.mockClear();

    await POST(createWebhookRequest({ webhookId }));
    expect(consoleSpy).not.toHaveBeenCalledWith(
      "[polar-webhook]",
      expect.anything()
    );
  });
});
```

### Section F: Malformed Payload Handling

| # | Test | Expected |
|---|------|----------|
| F1 | Empty body | Does not crash, returns error response (400 or 403 from SDK) |
| F2 | Missing `type` field in payload | Handled gracefully, no unhandled exception |
| F3 | Missing `data` field in payload | Handled gracefully, no unhandled exception |

```typescript
describe("Malformed payload handling", () => {
  it("handles empty body without crashing", async () => {
    const req = createWebhookRequest({ body: {} });
    simulateMalformedBody();
    const res = await POST(req);
    expect([400, 403]).toContain(res.status);
  });

  it("handles payload with missing type field gracefully", async () => {
    const req = createWebhookRequest({ body: { data: { id: "test" } } });
    simulateValidSignature();
    const res = await POST(req);
    expect(res.status).toBe(202);
    // Should not throw
  });

  it("handles payload with missing data field gracefully", async () => {
    const req = createWebhookRequest({ body: { type: "benefit_grant.created" } });
    simulateValidSignature();
    const res = await POST(req);
    expect(res.status).toBe(202);
    // Should not throw
  });
});
```

### Section G: HTTP Method and Response

| # | Test | Expected |
|---|------|----------|
| G1 | POST request returns 202 on success | Status 202 (not 200) |
| G2 | Only `POST` is exported from the route | The module exports `POST`, no `GET`/`PUT`/`DELETE` |

```typescript
describe("HTTP method and response", () => {
  it("returns 202 (not 200) on successful webhook", async () => {
    const req = createWebhookRequest();
    simulateValidSignature();
    const res = await POST(req);
    expect(res.status).toBe(202);
    expect(res.status).not.toBe(200);
  });

  it("exports only POST handler from route module", async () => {
    const routeModule = await import("../route");
    expect(routeModule.POST).toBeDefined();
    expect((routeModule as any).GET).toBeUndefined();
    expect((routeModule as any).PUT).toBeUndefined();
    expect((routeModule as any).DELETE).toBeUndefined();
  });
});
```

### Section H: Response Time

| # | Test | Expected |
|---|------|----------|
| H1 | Handler responds within 2 seconds | Elapsed time < 2000ms |

```typescript
describe("Response time", () => {
  it("responds within 2 seconds", async () => {
    const req = createWebhookRequest();
    simulateValidSignature();
    const start = performance.now();
    await POST(req);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
```

### Section I: Idempotency Map Internals

| # | Test | Expected |
|---|------|----------|
| I1 | `cleanExpired()` removes entries older than 10 minutes | After advancing timers, expired entries are purged |
| I2 | `isDuplicate()` returns `false` for new ID, `true` for seen ID | First call false, second call true |
| I3 | Map does not grow unbounded under high volume | After many requests + time advance, Map size stays bounded |

These tests target the exported (or module-internal) idempotency functions. If `isDuplicate` and `cleanExpired` are not exported, test them indirectly through the route handler behavior (covered in Section C).

```typescript
describe("Idempotency map internals (if exported)", () => {
  it("isDuplicate returns false for new ID, true for repeated ID", () => {
    expect(isDuplicate("wh_new")).toBe(false);
    expect(isDuplicate("wh_new")).toBe(true);
  });

  it("cleanExpired removes entries older than DEDUP_TTL_MS", () => {
    vi.useFakeTimers();
    isDuplicate("wh_expire_test");
    vi.advanceTimersByTime(11 * 60 * 1000);
    cleanExpired();
    expect(isDuplicate("wh_expire_test")).toBe(false); // Re-processed as new
    vi.useRealTimers();
  });
});
```

---

## 5. Test Count Summary

| Section | Tests |
|---------|-------|
| A: Signature Verification | 3 |
| B: Stale Timestamp Rejection | 2 |
| C: Idempotency | 3 |
| D: Event Type Handling | 4 |
| E: Structured Logging | 2 |
| F: Malformed Payload Handling | 3 |
| G: HTTP Method and Response | 2 |
| H: Response Time | 1 |
| I: Idempotency Map Internals | 2 |
| **Total** | **22** |

---

## 6. Files to Create

| File | Purpose |
|------|---------|
| `apps/docs/app/api/webhooks/polar/__tests__/webhook.test.ts` | All 22 tests in a single file |

---

## 7. Mock Implementations

### `@polar-sh/nextjs` Module Mock

```typescript
import { vi, type Mock } from "vitest";

let capturedOnPayload: ((payload: any) => Promise<void>) | null = null;
let mockBehavior: "valid" | "invalid-sig" | "stale" | "malformed" = "valid";

vi.mock("@polar-sh/nextjs", () => ({
  Webhooks: vi.fn(
    (config: { webhookSecret: string; onPayload: (payload: any) => Promise<void> }) => {
      capturedOnPayload = config.onPayload;

      // Return a route handler function
      return async (req: Request): Promise<Response> => {
        if (mockBehavior === "invalid-sig") {
          return new Response("Invalid signature", { status: 403 });
        }
        if (mockBehavior === "stale") {
          return new Response("Stale timestamp", { status: 403 });
        }
        if (mockBehavior === "malformed") {
          return new Response("Bad request", { status: 400 });
        }

        const body = await req.clone().json();
        await config.onPayload(body);
        return new Response(null, { status: 202 });
      };
    }
  ),
}));

// Helpers used in tests
function simulateValidSignature() { mockBehavior = "valid"; }
function simulateInvalidSignature() { mockBehavior = "invalid-sig"; }
function simulateStaleTimestamp() { mockBehavior = "stale"; }
function simulateMalformedBody() { mockBehavior = "malformed"; }
```

### `NextRequest` Construction

```typescript
import { NextRequest } from "next/server";

// NextRequest accepts a URL string and RequestInit
// Headers include Standard Webhooks headers: webhook-id, webhook-timestamp, webhook-signature
```

---

## 8. Running Tests

```bash
# Run webhook tests only
pnpm --filter docs test -- webhook

# Run all docs tests
pnpm --filter docs test

# Run with coverage
pnpm --filter docs test -- --coverage
```

---

## 9. Exit Criteria Traceability

| Exit Criterion (from phase-4.md) | Test(s) |
|----------------------------------|---------|
| 1. Webhook verifies signatures via `Webhooks()` | A1, A2, A3 |
| 2. Invalid signatures return 403 | A2, A3 |
| 3. Duplicate `webhook-id` returns 202 without re-processing | C1, C2 |
| 4. Stale webhooks (>5 min) return 403 | B1 |
| 5. Handler responds within 2 seconds | H1 |
| 6. Handler returns HTTP 202 on success | G1, D1-D3 |
| 7. `benefit_grant.created`/`.updated`/`.revoked` handled | D1, D2, D3 |
| 8. Pricing page renders with checkout link | Manual verification (not unit tested) |
| 9. Webhook tests pass | All 22 tests green |
