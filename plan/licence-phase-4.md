# Phase 4 — Webhook Handler + Docs Pricing Page

**Duration:** Days 14–16 (~4.5 hours)
**Depends on:** Phase 0 (Polar sandbox configured), Phase 1 (types)
**Blocks:** Phase 5
**Risk Level:** MEDIUM — webhook signature verification is a common source of bugs
**Stack:** nextjs, typescript

---

## 1. Objective + What Success Looks Like

Build a server-side webhook handler at `apps/docs/app/api/webhooks/polar/route.ts` that receives Polar.sh webhook events, verifies their HMAC-SHA256 signature using the Standard Webhooks spec, and handles `benefit_grant.created` and `benefit_grant.revoked` events. Finalize the existing pricing page with a live Polar checkout link.

**What success looks like:**

- POST to `/api/webhooks/polar` with a valid Standard Webhooks signature returns 200 and processes the event.
- POST with an invalid or missing signature returns 401 immediately — no event processing occurs.
- `benefit_grant.created` events log the sale (customer email, license key ID, timestamp).
- `benefit_grant.revoked` events log the revocation (customer email, license key ID, reason).
- The pricing page at `/pricing` links directly to the live Polar checkout for Tour Kit Pro.
- Webhook handler tests pass with mocked signature verification.

---

## 2. Architecture / Key Design Decisions

### Webhook Route Design

The webhook handler is a Next.js App Router route handler (Server Component — no client state). It runs entirely server-side and never touches the browser.

**Request flow:**

```
Polar.sh event → POST /api/webhooks/polar
  → Read raw body as text (NOT json — signature is computed over raw bytes)
  → Extract headers: webhook-id, webhook-timestamp, webhook-signature
  → Verify HMAC-SHA256 signature using standard-webhooks package
  → Parse JSON body, validate with Zod
  → Switch on event type → handle benefit_grant.created / benefit_grant.revoked
  → Return 200 (or 401 for bad signature, 400 for bad payload)
```

### Signature Verification Strategy

Use the `standard-webhooks` npm package rather than hand-rolling HMAC verification. This avoids the most common bugs:

- Forgetting to strip the `whsec_` prefix from the secret
- Forgetting to base64-decode the secret after stripping the prefix
- Incorrect signed content format (`{webhook-id}.{webhook-timestamp}.{raw_body}`)
- Not handling the `v1,{base64(hmac)}` signature format with space-delimited list for key rotation
- Timestamp tolerance (replay attack protection)

The `standard-webhooks` package handles all of this correctly out of the box.

**Alternative:** `@polar-sh/sdk/webhooks` `validateEvent()` wraps the same logic. Either works — prefer `standard-webhooks` to avoid pulling in the full Polar SDK as a server dependency.

### Data Model Strategy

No database. This is Phase 4 — the webhook handler logs events for now. Future phases may persist to a database for admin dashboards, but the current scope is:

1. **Verify** the webhook signature (security gate).
2. **Parse** the event payload with Zod (type safety).
3. **Log** the event (structured console output for Vercel/server logs).
4. **Return 200** so Polar does not retry.

This keeps the handler stateless and simple. If the handler throws or returns non-2xx, Polar retries up to 10 times with exponential backoff (10s timeout per attempt).

### Zod Schemas for Webhook Payloads

Define minimal Zod schemas for the two event types we care about. Only validate the fields we actually read — Polar may add fields over time, and `z.passthrough()` prevents breakage.

```typescript
// Minimal shape — not the full Polar event schema
const benefitGrantEventSchema = z.object({
  type: z.enum(['benefit_grant.created', 'benefit_grant.revoked']),
  data: z.object({
    id: z.string(),
    benefit_id: z.string(),
    customer: z.object({
      email: z.string().email(),
    }).passthrough(),
    properties: z.object({
      license_key_id: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough()
```

### Pricing Page Update

The pricing page (`apps/docs/app/pricing/page.tsx` + `components/landing/pricing.tsx`) already exists with Free vs Pro cards, comparison table, and FAQ. The only change is updating the placeholder Polar checkout URL (`https://polar.sh/tour-kit/products`) to the actual product checkout URL once the Polar product is created in Phase 0.

### Environment Variables

One new env var: `POLAR_WEBHOOK_SECRET` — the base64-encoded secret from Polar dashboard, prefixed with `whsec_`. The `standard-webhooks` package expects the full prefixed string.

---

## 3. Tasks

### Task 4.1: Implement webhook route (2h)

**File:** `apps/docs/app/api/webhooks/polar/route.ts`

**Steps:**

1. Install `standard-webhooks` package in the docs app: `pnpm --filter docs add standard-webhooks`
2. Create the route file with a single `POST` export (App Router convention).
3. Read the raw request body as text using `await request.text()` — do NOT use `request.json()` because the signature is computed over the raw string.
4. Extract the three Standard Webhooks headers from the request.
5. Instantiate `Webhook` from `standard-webhooks` with `POLAR_WEBHOOK_SECRET`.
6. Call `wh.verify(rawBody, headers)` inside a try/catch — catch returns `NextResponse.json({ error: 'Invalid signature' }, { status: 401 })`.
7. Parse the verified payload with the Zod schema.
8. Switch on `event.type`:
   - `benefit_grant.created`: Log structured sale info (customer email, benefit ID, license key ID, timestamp).
   - `benefit_grant.revoked`: Log structured revocation info.
   - Default: Log unknown event type, still return 200 (don't block Polar retries for events we don't handle yet).
9. Return `NextResponse.json({ received: true }, { status: 200 })`.

**Key implementation details:**

```typescript
import { Webhook } from 'standard-webhooks'

export async function POST(request: Request) {
  const rawBody = await request.text()

  const headers = {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
  }

  const wh = new Webhook(process.env.POLAR_WEBHOOK_SECRET!)

  try {
    wh.verify(rawBody, headers)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = benefitGrantEventSchema.safeParse(JSON.parse(rawBody))
  // ... handle event
}
```

**Critical:** The `Webhook` constructor from `standard-webhooks` expects the full `whsec_`-prefixed secret. It handles stripping the prefix and base64-decoding internally. Do NOT manually strip the prefix.

### Task 4.2: Add POLAR_WEBHOOK_SECRET to env config (0.5h)

**Files:**
- `apps/docs/.env.example` (create if it does not exist)
- `apps/docs/.env.local` (add locally, never commit)

**Steps:**

1. Add `POLAR_WEBHOOK_SECRET=whsec_your_secret_here` to `.env.example` with a comment explaining the format.
2. Add the real secret from Polar dashboard to `.env.local`.
3. Verify `.env.local` is in `.gitignore` (it should be by default in Next.js).

### Task 4.3: Pricing page — DONE

Already exists at:
- `apps/docs/app/pricing/page.tsx` — page wrapper with metadata
- `apps/docs/components/landing/pricing.tsx` — Free vs Pro cards, comparison table, FAQ

No work required.

### Task 4.4: Update Polar checkout link (0.5h)

**File:** `apps/docs/components/landing/pricing.tsx`

**Steps:**

1. Replace the placeholder URL `https://polar.sh/tour-kit/products` with the actual Polar checkout URL for the Tour Kit Pro product.
2. The URL format from Polar is typically `https://polar.sh/checkout/<product-id>` or a custom storefront link.
3. Consider extracting the URL to a config constant or env var (`NEXT_PUBLIC_POLAR_CHECKOUT_URL`) so it can be changed without code changes.

### Task 4.5: Write webhook handler tests (1h)

**File:** `apps/docs/__tests__/webhook.test.ts` (or co-located at `apps/docs/app/api/webhooks/polar/__tests__/route.test.ts`)

**Test cases:**

1. **Valid signature + benefit_grant.created** — mock `Webhook.verify()` to not throw, send a valid payload, assert 200 response.
2. **Valid signature + benefit_grant.revoked** — same setup, revocation payload, assert 200.
3. **Invalid signature** — mock `Webhook.verify()` to throw `WebhookVerificationError`, assert 401 response with error message.
4. **Missing headers** — send request without webhook headers, assert 401.
5. **Unknown event type** — send a valid signature with an unhandled event type (e.g., `order.created`), assert 200 (don't reject unknown events).
6. **Malformed JSON body** — send garbage body with valid headers (verification will fail), assert 401.

**Mocking strategy:** Mock the `standard-webhooks` package's `Webhook` class. The `verify()` method either returns the parsed payload or throws — mock both paths.

### Task 4.6: Test webhook locally with Polar sandbox (0.5h)

**Steps:**

1. Start the docs dev server: `pnpm --filter docs dev`
2. Expose local port via ngrok or similar tunnel (or use Polar's sandbox webhook test feature).
3. In Polar dashboard (sandbox), configure webhook endpoint to point at the tunnel URL + `/api/webhooks/polar`.
4. Trigger a test event from Polar dashboard.
5. Verify:
   - Server logs show the event was received and processed.
   - Response is 200.
   - Structured log output contains expected fields (customer email, benefit ID).
6. Test with a tampered signature (manually edit a header) — verify 401 response.

---

## 4. Deliverables

| File | Description |
|------|-------------|
| `apps/docs/app/api/webhooks/polar/route.ts` | Webhook handler with Standard Webhooks HMAC-SHA256 signature verification |
| `apps/docs/.env.example` | Documents `POLAR_WEBHOOK_SECRET` env var format |
| `apps/docs/components/landing/pricing.tsx` | Updated with live Polar checkout URL (minor change) |
| `apps/docs/__tests__/webhook.test.ts` | 6 test cases covering valid/invalid signatures and event types |
| `apps/docs/package.json` | `standard-webhooks` added as dependency |

---

## 5. Exit Criteria

- [ ] Webhook handler verifies Standard Webhooks HMAC-SHA256 signature correctly
- [ ] Invalid signatures return 401 with `{ error: 'Invalid signature' }`
- [ ] `benefit_grant.created` logs sale (customer email, license key ID, timestamp)
- [ ] `benefit_grant.revoked` logs revocation (customer email, license key ID, reason)
- [ ] Unknown event types return 200 (no rejection, no retry)
- [ ] Raw body is read as text, not parsed as JSON before verification
- [ ] `POLAR_WEBHOOK_SECRET` documented in `.env.example`
- [ ] Pricing page renders Free vs Pro comparison with live checkout link
- [ ] All 6 webhook tests pass
- [ ] Polar sandbox test event processed successfully (manual verification)

---

## 6. Execution Prompt

> You are implementing Phase 4 of the Tour Kit licensing system. Tour Kit is a headless onboarding/product tour library for React. The docs site runs on Next.js App Router at `apps/docs/`. You are replacing JWT licensing with Polar.sh-backed license keys.
>
> **Your task:** Build the webhook handler and update the pricing checkout link.
>
> ### Confirmed Webhook Signing Details (Standard Webhooks Spec)
>
> - **Algorithm:** HMAC-SHA256
> - **Headers:** `webhook-id`, `webhook-timestamp`, `webhook-signature`
> - **Signed content:** `{webhook-id}.{webhook-timestamp}.{raw_body}`
> - **Secret format:** Base64-encoded, prefixed with `whsec_`
> - **Signature format:** `v1,{base64(hmac)}` (space-delimited list for key rotation)
> - **Package:** Use `standard-webhooks` npm package — its `Webhook` constructor accepts the full `whsec_`-prefixed secret and handles stripping/decoding internally
> - **Relevant events:** `benefit_grant.created`, `benefit_grant.revoked`
> - **Retry policy:** Up to 10 retries, exponential backoff, 10s timeout — always return 200 for events you don't handle
>
> ### Per-File Guidance
>
> **`apps/docs/app/api/webhooks/polar/route.ts`** (CREATE)
> - Export a single `POST` function (Next.js App Router route handler convention).
> - Read body with `await request.text()` — NEVER `request.json()` — signature is computed over raw bytes.
> - Extract `webhook-id`, `webhook-timestamp`, `webhook-signature` from request headers.
> - Instantiate `new Webhook(process.env.POLAR_WEBHOOK_SECRET!)` from `standard-webhooks`.
> - Call `wh.verify(rawBody, headers)` in try/catch. Catch → return 401.
> - After verification, parse JSON and validate with Zod schema (use `z.passthrough()` on all objects to tolerate extra fields).
> - Handle `benefit_grant.created`: log `{ event: 'license_sale', email, benefitId, licenseKeyId, timestamp }`.
> - Handle `benefit_grant.revoked`: log `{ event: 'license_revocation', email, benefitId, licenseKeyId, timestamp }`.
> - Unknown event types: log and return 200.
> - Return `NextResponse.json({ received: true }, { status: 200 })`.
>
> **`apps/docs/.env.example`** (CREATE if missing)
> - Add: `# Polar webhook secret (from Polar dashboard → Webhooks → Secret)`
> - Add: `POLAR_WEBHOOK_SECRET=whsec_your_secret_here`
>
> **`apps/docs/components/landing/pricing.tsx`** (EDIT — line 135)
> - Replace `https://polar.sh/tour-kit/products` with the actual Polar product checkout URL once available. If the URL is not yet known, extract to a constant at the top of the file for easy future replacement.
>
> **`apps/docs/__tests__/webhook.test.ts`** (CREATE)
> - Mock `standard-webhooks` package: `jest.mock('standard-webhooks')`.
> - Test 6 cases: valid created event (200), valid revoked event (200), invalid signature (401), missing headers (401), unknown event type (200), malformed body (401).
> - Mock `Webhook.prototype.verify` to either return void or throw.
>
> **`apps/docs/package.json`** (EDIT)
> - Add `standard-webhooks` to dependencies. Install via `pnpm --filter docs add standard-webhooks`.
>
> ### Success Criteria
>
> 1. `POST /api/webhooks/polar` with valid Standard Webhooks signature → 200
> 2. `POST /api/webhooks/polar` with invalid/missing signature → 401
> 3. `benefit_grant.created` payload → structured log with customer email and license key ID
> 4. `benefit_grant.revoked` payload → structured log with revocation details
> 5. Unknown event types → 200 (no rejection)
> 6. Raw body read as text before verification (not JSON-parsed first)
> 7. All 6 webhook tests pass
> 8. `POLAR_WEBHOOK_SECRET` documented in `.env.example`
> 9. Pricing page checkout link updated or extracted to a config constant

---

## Readiness Check

Before starting Phase 4, confirm:

- [ ] **Phase 0 complete:** Polar sandbox account exists, test product created, webhook secret available in Polar dashboard
- [ ] **Phase 1 types available:** `LicenseState`, `PolarValidateResponse`, and related types are defined in `packages/license/src/types/index.ts` (needed for shared type references, though the webhook handler mostly uses its own Zod schemas)
- [ ] **Polar webhook secret in hand:** The `whsec_`-prefixed secret string has been copied from Polar dashboard → Webhooks → Secret
- [ ] **Docs site runs locally:** `pnpm --filter docs dev` starts without errors
- [ ] **Polar checkout URL known** (or deferred to Phase 5 if Polar product setup is not finalized — use placeholder constant for now)
