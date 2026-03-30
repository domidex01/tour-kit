# Phase 4 — Webhook Handler + Docs Pricing Page

| Field | Value |
|-------|-------|
| **Duration** | Days 14–16 (~6–8 hours) |
| **Depends on** | Phase 0 (Polar sandbox account created) |
| **Blocks** | Phase 5 |
| **Risk Level** | MEDIUM — webhook security requires careful implementation |
| **Stack** | nextjs |

---

## 1. Objective

Build the server-side Polar webhook handler at `apps/docs/app/api/webhooks/polar/route.ts` and finalize the pricing page checkout link on tourkit.dev.

### What Success Looks Like

- A webhook endpoint that receives Polar events, verifies signatures via `@polar-sh/nextjs`, deduplicates replays, and responds HTTP 202 within 2 seconds.
- The existing pricing page at `/pricing` points to the real Polar checkout URL (not the current placeholder `https://polar.sh/tour-kit/products`).
- Automated tests cover signature verification, idempotency, and stale-timestamp rejection.

---

## 2. Key Design Decisions

### D1: `@polar-sh/nextjs` Webhooks() wrapper (not raw SDK)

Use the `Webhooks()` helper from `@polar-sh/nextjs` instead of manually calling `@polar-sh/sdk/webhooks` `validateEvent()`. The wrapper handles signature verification, base64 secret decoding (`whsec_` prefix), and timestamp tolerance automatically. This eliminates manual Standard Webhooks verification code and reduces the security surface area.

### D2: App Router API Route (not Pages API, not Server Actions)

The webhook handler is a Next.js App Router route handler (`export const POST`). Webhooks are external POST requests from Polar servers — Server Actions are not appropriate here.

### D3: In-memory idempotency (Map with 10-minute TTL)

Use an in-memory `Map<string, number>` keyed by `webhook-id` header with a 10-minute TTL and lazy eviction. This is sufficient because:
- The docs site runs as a single process (Vercel serverless or self-hosted).
- Polar retries within minutes, not hours.
- No database dependency for a logging-only webhook.

Duplicate `webhook-id` values return 202 (not an error code) to prevent Polar from retrying.

### D4: HTTP 202 (not 200)

Polar documents 202 Accepted as the expected response. Returning 200 works but 202 is the documented best practice. Redirects (301/302) count as failures and trigger retries.

### D5: Logging only (no database writes)

Phase 4 webhook handler logs events to `console.log` with structured data. Polar is the source of truth for license state. The webhook exists for:
- Confirming the integration works end-to-end.
- Server-side observability (benefit grants, revocations).
- A hook point for future features (welcome emails, Slack notifications).

### D6: Zod validation for webhook payloads

Validate incoming payload shape with Zod schemas before processing. This catches malformed events early and provides type-safe access to `benefit_grant` fields.

---

## 3. Tasks

### 4.1 — Webhook route handler (2h)

**File:** `apps/docs/app/api/webhooks/polar/route.ts`

Create the webhook endpoint using the confirmed `@polar-sh/nextjs` API:

```typescript
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // payload.type: 'benefit_grant.created' | 'benefit_grant.updated' | 'benefit_grant.revoked'
    // payload.data: { benefit_id, customer_id, benefit, ... }
  },
});
```

The `Webhooks()` wrapper handles:
- Signature verification (`webhook-signature` header, Standard Webhooks spec).
- Base64 secret decoding (`whsec_` prefix).
- Timestamp tolerance (rejects events older than 5 minutes).
- JSON body parsing and typed payload delivery.
- Returns 202 on success, 403 on invalid signature.

Implementation requirements:
- Add idempotency check before processing (see task 4.7).
- Log each event type with structured data: `{ type, benefit_id, customer_id, timestamp }`.
- Handle `benefit_grant.created`, `benefit_grant.updated`, and `benefit_grant.revoked` events.
- Handle unknown event types gracefully (log and skip).
- Keep all processing synchronous and fast (logging only) to stay within the 2-second window.
- Do NOT add `export const runtime = 'edge'` — use the default Node.js runtime.

**Install dependency:**
```bash
pnpm --filter docs add @polar-sh/nextjs
```

### 4.2 — Environment configuration (0.5h)

**File:** `apps/docs/.env.example`

- Create `apps/docs/.env.example` with `POLAR_WEBHOOK_SECRET=whsec_...` placeholder.
- Verify `.gitignore` covers `.env` and `.env.local` in the docs app.
- Document the env var in the file with a comment pointing to the Polar dashboard location.

### 4.3 — Pricing page (0h — DONE)

Already exists at:
- `apps/docs/app/pricing/page.tsx` — page wrapper with metadata.
- `apps/docs/components/landing/pricing.tsx` — Full pricing component with Free/Pro cards, comparison table, and FAQ.

No work required.

### 4.4 — Update Polar checkout link (0.5h)

**File:** `apps/docs/components/landing/pricing.tsx`

The current pricing component has a placeholder link on line 131:
```tsx
href="https://polar.sh/tour-kit/products"
```

Update to the actual Polar checkout URL once the product is created in Phase 0. The URL format is:
```
https://polar.sh/tour-kit/checkout?product_id=<PRODUCT_ID>
```

Optionally, extract to a config constant for easier future updates:
```typescript
// apps/docs/lib/polar-config.ts
export const POLAR_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL ?? "https://polar.sh/tour-kit/products";
```

### 4.5 — Webhook handler tests (1h)

**File:** `apps/docs/__tests__/webhook.test.ts` (or colocated at `apps/docs/app/api/webhooks/polar/__tests__/route.test.ts`)

Test cases:
1. Valid signature + `benefit_grant.created` event — returns 202.
2. Valid signature + `benefit_grant.updated` event — returns 202.
3. Valid signature + `benefit_grant.revoked` event — returns 202.
4. Invalid signature — returns 403.
5. Duplicate `webhook-id` — returns 202 without re-processing (idempotency).
6. Stale timestamp (>5 min old) — returns 403 (handled by SDK).
7. Malformed payload — handled gracefully (no crash).
8. Logs structured data for each event type.

Mock strategy: Mock the `@polar-sh/nextjs` `Webhooks` function to test handler logic, or use Standard Webhooks library to generate valid test signatures for integration testing.

### 4.6 — Local webhook testing (0.5h)

Manual verification step:
- Use Polar sandbox dashboard to send a test webhook event.
- Verify the handler responds 202 within 2 seconds.
- Confirm structured log output appears in the terminal.
- Document results in `plan/phase-4-status.json`.

### 4.7 — Webhook idempotency (0.5h)

**File:** `apps/docs/app/api/webhooks/polar/route.ts` (integrated into the handler)

Implement deduplication using `webhook-id` header with an in-memory Map:

```typescript
const processedWebhooks = new Map<string, number>();
const DEDUP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cleanExpired(): void {
  const now = Date.now();
  for (const [id, ts] of processedWebhooks) {
    if (now - ts > DEDUP_TTL_MS) processedWebhooks.delete(id);
  }
}

function isDuplicate(webhookId: string): boolean {
  cleanExpired();
  if (processedWebhooks.has(webhookId)) return true;
  processedWebhooks.set(webhookId, Date.now());
  return false;
}
```

Key behavior:
- Duplicate `webhook-id` returns 202 (not an error) to prevent Polar retries.
- TTL cleanup runs on each request (lazy eviction) — acceptable at webhook volume.
- If `webhook-id` is not accessible inside `onPayload`, wrap the `Webhooks()` handler to intercept the `Request` object and extract the header before delegating.

### 4.8 — Timestamp tolerance validation (0.5h)

**File:** `apps/docs/app/api/webhooks/polar/route.ts`

The `@polar-sh/nextjs` `Webhooks()` wrapper handles timestamp validation automatically via the Standard Webhooks spec (rejects events older than 5 minutes with 403).

This task is verification:
- Confirm the SDK rejects stale `webhook-timestamp` headers by writing a test (in 4.5).
- If the SDK does NOT handle it, add manual validation before processing.
- Log rejected stale webhooks for monitoring.

---

## 4. Deliverables

```
apps/docs/
├── .env.example                                    # NEW
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── polar/
│   │           └── route.ts                        # NEW
│   └── pricing/
│       └── page.tsx                                # EXISTS (unchanged)
├── components/
│   └── landing/
│       └── pricing.tsx                             # MODIFIED (checkout URL)
├── lib/
│   └── polar-config.ts                             # NEW (optional)
└── __tests__/
    └── webhook.test.ts                             # NEW
```

---

## 5. Exit Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Webhook handler verifies signatures via `@polar-sh/nextjs` `Webhooks()` | Code review: `Webhooks({ webhookSecret })` pattern in route.ts |
| 2 | Invalid signatures return 403 | Test: request with bad signature asserts 403 |
| 3 | Replayed webhooks (duplicate `webhook-id`) return 202 without re-processing | Test: same webhook-id sent twice, second call skips handler logic |
| 4 | Stale webhooks (timestamp > 5 min old) return 403 | Test: verify SDK rejects stale timestamp |
| 5 | Handler responds within 2 seconds | Manual: Polar sandbox test event completes <2s |
| 6 | Handler returns HTTP 202 on success | Test: valid webhook returns 202 |
| 7 | `benefit_grant.created`/`.updated`/`.revoked` handled | Test: each event type triggers structured log |
| 8 | Pricing page renders Free vs Pro with checkout link | Manual: visit `/pricing`, Pro button links to Polar checkout |
| 9 | Webhook tests pass | `pnpm --filter docs test` — all webhook tests green |

---

## 6. Execution Prompt

> **Self-contained implementation instructions for Phase 4.**
> Copy this section into a new conversation to implement the phase.

You are implementing Phase 4 (Webhook Handler + Docs Pricing Page) of the Tour Kit licensing system. The docs site is a Next.js 15 App Router app at `apps/docs/`. The pricing page already exists — your primary task is the webhook handler.

### Prerequisites

- Polar sandbox account exists with a product, webhook secret (`whsec_...`), and product ID (from Phase 0).
- `@polar-sh/nextjs` is installed: `pnpm --filter docs add @polar-sh/nextjs`.

### Confirmed API: @polar-sh/nextjs Webhooks()

```typescript
// apps/docs/app/api/webhooks/polar/route.ts
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // payload.type: 'benefit_grant.created' | 'benefit_grant.updated' | 'benefit_grant.revoked'
    // payload.data: { benefit_id, customer_id, benefit, ... }
  },
});
```

The wrapper handles signature verification, base64 secret decoding, timestamp tolerance (rejects >5 min), and returns 202/403 automatically.

### Idempotency Pattern

```typescript
const processedWebhooks = new Map<string, number>();
const DEDUP_TTL_MS = 10 * 60 * 1000;

function cleanExpired(): void {
  const now = Date.now();
  for (const [id, ts] of processedWebhooks) {
    if (now - ts > DEDUP_TTL_MS) processedWebhooks.delete(id);
  }
}

function isDuplicate(webhookId: string): boolean {
  cleanExpired();
  if (processedWebhooks.has(webhookId)) return true;
  processedWebhooks.set(webhookId, Date.now());
  return false;
}
```

Return 202 for duplicates (not an error code) to prevent Polar retries.

### Per-File Guidance

#### `apps/docs/app/api/webhooks/polar/route.ts` (NEW)

- Use `Webhooks()` from `@polar-sh/nextjs` with `webhookSecret` from env.
- Add the idempotency Map at module scope (persists across requests in the same process).
- Inside `onPayload`: check `isDuplicate()` first, then switch on `payload.type`.
- Log structured data: `console.log("[polar-webhook]", { type, benefit_id, customer_id, timestamp })`.
- Handle `benefit_grant.created`, `benefit_grant.updated`, `benefit_grant.revoked`.
- Log unknown event types without crashing.
- Do NOT use `export const runtime = 'edge'`.
- If `webhook-id` is not accessible inside `onPayload`, wrap the handler: intercept the Request, extract the `webhook-id` header, pass it into a closure, then delegate to the Webhooks() handler.

#### `apps/docs/.env.example` (NEW)

```env
# Polar webhook secret (Polar dashboard > Webhooks > Secret)
# Format: whsec_<base64-encoded-secret>
POLAR_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Polar checkout URL (Polar dashboard > Products > Checkout link)
# NEXT_PUBLIC_POLAR_CHECKOUT_URL=https://polar.sh/tour-kit/checkout?product_id=xxx
```

#### `apps/docs/components/landing/pricing.tsx` (MODIFY)

Update line 131 — change the checkout href from the placeholder to the real URL:
```tsx
// Before:
href="https://polar.sh/tour-kit/products"

// After (direct):
href="https://polar.sh/tour-kit/checkout?product_id=<PRODUCT_ID>"

// Or (config-driven):
import { POLAR_CHECKOUT_URL } from '@/lib/polar-config'
// ...
href={POLAR_CHECKOUT_URL}
```

If the product ID is not yet known, create the config file with the fallback and update later.

#### `apps/docs/__tests__/webhook.test.ts` (NEW)

Test structure (Vitest):
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Polar webhook handler", () => {
  it("returns 202 for valid benefit_grant.created event");
  it("returns 202 for valid benefit_grant.updated event");
  it("returns 202 for valid benefit_grant.revoked event");
  it("returns 403 for invalid signature");
  it("returns 202 without re-processing for duplicate webhook-id");
  it("logs structured data for each event type");
  it("handles unknown event types gracefully");
});
```

Mock the `@polar-sh/nextjs` module or use `createRequest()` helpers to construct test requests with valid/invalid signatures.

### Verification Commands

```bash
# Install dependency
pnpm --filter docs add @polar-sh/nextjs

# Type check
pnpm --filter docs typecheck

# Run tests
pnpm --filter docs test

# Build
pnpm --filter docs build
```

---

## Readiness Check

Before starting Phase 4, confirm:

- [ ] **Phase 0 complete** — Polar sandbox account exists with a test product and `whsec_` secret available
- [ ] **`@polar-sh/nextjs` installable** — `pnpm --filter docs add @polar-sh/nextjs` resolves successfully
- [ ] **Polar webhook secret obtained** — The `whsec_...` value from the Polar dashboard is ready to set in `.env`
- [ ] **Polar product ID known** (for task 4.4) — If not yet created, task 4.4 can use the placeholder URL and be updated after Phase 0 product setup
- [ ] **Test runner works in docs app** — `pnpm --filter docs test` executes (Vitest or configured runner)
- [ ] **Pricing page renders** — `pnpm --filter docs dev` and visit `/pricing` to confirm the existing page loads correctly
