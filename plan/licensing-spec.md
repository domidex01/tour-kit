# Tour Kit Licensing System — Technical Specification

**Version:** 1.0.0
**Date:** 2026-03-21
**Status:** Draft

---

## 1. Problem Statement & Value Analysis

Tour Kit is an open-source onboarding library. The core (tours, steps, hints) should remain free and MIT-licensed. Extended packages (analytics, announcements, checklists, adoption, media, scheduling, ai) represent significant engineering effort and should generate revenue through a one-time Pro license.

Polar.sh handles payment processing, license key generation, and activation tracking — eliminating the need for a custom payment backend.

### Competitive Landscape

| Product | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Shepherd.js** | OSS / non-commercial | $50 lifetime / 5 projects | $300 lifetime / unlimited |
| **Tour Kit** (proposed) | MIT / unlimited | $99 lifetime / 5 sites | Deferred |

Shepherd offers basic tour functionality. Tour Kit's Pro tier includes 7 additional packages (analytics, announcements, checklists, adoption, media, scheduling, AI) — significantly more value at a comparable price point.

### Business Model

| Tier | Price | Sites | Packages Included |
|------|-------|-------|-------------------|
| **Free (MIT)** | $0 | Unlimited | `core`, `react`, `hints` |
| **Pro** | $99 one-time | 5 sites | All extended packages (analytics, announcements, checklists, adoption, media, scheduling, ai) |

### Revenue Projection

| Metric | Value |
|--------|-------|
| Target Pro sales (Year 1) | 300–800 licenses |
| Revenue range (Year 1) | $29,700–$79,200 |
| Marginal cost per sale | $0 (Polar handles billing, no server costs) |

---

## 2. Architecture Overview

### System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     CUSTOMER FLOW                        │
│                                                          │
│  tourkit.dev/pricing                                     │
│       │ Click "Buy Pro"                                  │
│       ▼                                                  │
│  Polar Checkout (hosted)                                 │
│       │ Payment complete                                 │
│       ├──► Polar generates license key (TOURKIT-XXXX-…)  │
│       │    with limit_activations: 5                     │
│       │                                                  │
│       ├──► Webhook → tourkit.dev/api/webhooks/polar      │
│       │    send welcome email + log sale                 │
│       │                                                  │
│       └──► Customer receives key via Polar email         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  DEVELOPER INTEGRATION                   │
│                                                          │
│  .env.local                                              │
│    NEXT_PUBLIC_TOURKIT_LICENSE_KEY=TOURKIT-XXXX-XXXX      │
│                                                          │
│  App code:                                               │
│    <TourKitProvider licenseKey={key}>                     │
│       │                                                  │
│       ▼                                                  │
│  @tour-kit/license (runtime)                             │
│       │                                                  │
│       ├─ 1. Check localStorage cache (valid < 24h?)      │
│       │     YES → use cached result, skip network        │
│       │     NO  ↓                                        │
│       ├─ 2. POST polar.sh/v1/customer-portal/            │
│       │       license-keys/validate                      │
│       │     { key, organization_id }                     │
│       │                                                  │
│       ├─ 3. First validation per domain?                 │
│       │     YES → POST /license-keys/activate            │
│       │           { key, org_id, label: domain }         │
│       │           (consumes 1 of 5 activations)          │
│       │     NO  → include activation_id in validate      │
│       │                                                  │
│       └─ 4. Store result + activation_id in localStorage │
│            Set LicenseContext { valid, tier, features }   │
│                                                          │
│  Pro packages read LicenseContext:                       │
│    valid? → render full component                        │
│    invalid? → render fallback / dev warning              │
└──────────────────────────────────────────────────────────┘
```

### Layers

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| Payment | Polar.sh (external) | Checkout, billing, tax, license key generation |
| Webhook | `tourkit.dev/api/webhooks/polar` | Welcome email, sale logging, analytics |
| License SDK | `@tour-kit/license` package | Validate key, activate domains, cache results |
| Gate | `<LicenseGate>` component | Conditional rendering based on license state |
| Provider | `<TourKitProvider>` | Injects license context into component tree |

### Data Flow

1. Customer buys Pro on Polar checkout → receives license key via email
2. Developer adds `NEXT_PUBLIC_TOURKIT_LICENSE_KEY` to env
3. `<TourKitProvider>` calls `@tour-kit/license` on mount
4. License package validates key against Polar API (cached 24h)
5. First validation per domain auto-activates (1 of 5 slots)
6. Pro components check `LicenseContext` — render or show fallback

---

## 3. Data Model Strategy

| Type | Used For | Why |
|------|----------|-----|
| TypeScript `interface` | `LicenseValidation`, `PolarResponse`, `ActivationMeta` | Pure type safety, no runtime cost |
| Zod schema | API response parsing from Polar | Validates untrusted external data |
| `localStorage` object | Cached validation + activation_id | Avoid network calls on every page load |

### Key Types

```typescript
// Polar validation response (parsed with Zod)
interface PolarLicenseValidation {
  id: string
  organization_id: string
  status: 'granted' | 'revoked' | 'disabled'
  key: string
  limit_activations: number | null
  usage: number
  limit_usage: number | null
  validations: number
  expires_at: string | null
  activation: {
    id: string
    label: string
    meta: Record<string, string>
  } | null
}

// Internal license state (what components consume)
interface LicenseState {
  valid: boolean
  tier: 'free' | 'pro' | 'enterprise'
  activationId: string | null
  activationsUsed: number
  activationsLimit: number
  expiresAt: Date | null
  error: LicenseError | null
}

// Cached in localStorage
interface LicenseCache {
  state: LicenseState
  validatedAt: number  // timestamp
  domain: string
  activationId: string | null
}
```

---

## 4. Module Interface (No HTTP Backend Required)

Since Polar handles all payment/API work, `@tour-kit/license` is a client-side library, not a server.

### Public API

```typescript
// --- Core validation ---

/** Validate a license key against Polar API */
validateLicenseKey(
  key: string,
  options?: { organizationId?: string; skipCache?: boolean }
): Promise<LicenseState>

/** Activate a license key for a domain (consumes 1 activation slot) */
activateLicense(
  key: string,
  domain: string,
  options?: { organizationId?: string }
): Promise<{ activationId: string; activationsRemaining: number }>

/** Deactivate a license from a domain (frees 1 slot) */
deactivateLicense(
  key: string,
  activationId: string,
  options?: { organizationId?: string }
): Promise<void>

// --- React integration ---

/** Provider - validates on mount, caches, provides context */
<LicenseProvider
  licenseKey={string}
  organizationId={string}  // Polar org ID
  validateDomain?: boolean  // default: true in production
  cacheTtl?: number         // default: 86400000 (24h)
  onValidate?: (state: LicenseState) => void
  fallback?: ReactNode      // shown while validating
>

/** Gate - conditional render based on license */
<LicenseGate
  require?: 'pro' | 'enterprise'
  fallback?: ReactNode  // shown when unlicensed
>

/** Hook - access license state */
useLicense(): LicenseContextValue

/** Hook - check if pro features available */
useIsPro(): boolean
```

### Integration in Pro Packages

Each pro package checks the license internally:

```typescript
// Inside @tour-kit/analytics, @tour-kit/announcements, etc.
import { useLicense } from '@tour-kit/license'

function AnalyticsProvider({ children }) {
  const { valid, tier } = useLicense()

  if (!valid || tier === 'free') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[tour-kit] Analytics requires a Pro license. Get one at tourkit.dev/pricing')
    }
    return children // graceful degradation, not a hard block
  }

  return <AnalyticsContext.Provider>{children}</AnalyticsContext.Provider>
}
```

### Polar Dashboard Setup

```
Product: "Tour Kit Pro"
  - Type: One-time purchase
  - Price: $9,900 ($99.00)
  - Benefit: License Key
    - Prefix: "TOURKIT"
    - Activations limit: 5
    - Enable customer admin: true (self-serve activate/deactivate)
    - Expires: null (perpetual)
```

---

## 5. Quality Thresholds

| Feature | Metric | Threshold | Measurement |
|---------|--------|-----------|-------------|
| Validation latency (cached) | Time to return license state | < 1ms | `performance.now()` around cache read |
| Validation latency (network) | Time to validate via Polar API | < 500ms p95 | `performance.now()` around fetch |
| Bundle size | `@tour-kit/license` gzipped | < 3KB | `npx bundlephobia` / tsup output |
| Cache hit rate | % of validations served from cache | > 95% | Counter in LicenseProvider |
| Graceful degradation | Pro components without license | No crash, no blank screen | Integration test: render without key |
| Free tier zero-impact | Bundle size increase for free users | 0 bytes | Free packages must not import `@tour-kit/license` |
| Activation accuracy | Domain slots consumed correctly | Exactly 1 per unique domain | Integration test: validate same domain twice = 1 activation |

---

## 6. Key Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | Polar API down → new users can't validate | Low | High | 24h localStorage cache means existing users unaffected. New activations fail gracefully with dev warning, not a hard block. On extended outage (>24h), a static fallback validates key format only (TOURKIT-XXXX pattern check). |
| 2 | License key leaked / shared publicly | Medium | Medium | Activation limit = 5 domains. Excess activations rejected by Polar. Customer can self-serve deactivate stolen slots. Enterprise tier adds domain allowlist. |
| 3 | Bundle size creep from Polar SDK | Medium | Medium | Do NOT bundle `@polar-sh/sdk`. Use raw `fetch()` to 2 endpoints (validate + activate). Total added code: ~200 lines. |
| 4 | Piracy via patching `useLicense()` to return `{ valid: true }` | High | Low | Accept this. The target customer (teams building products) values updates/support over piracy effort. Add a "Powered by Tour Kit" console log for unlicensed pro usage — social enforcement. |
| 5 | localhost/dev environment consumes activation slot | High | Medium | Auto-detect `localhost`, `127.0.0.1`, and `*.local` domains — skip activation, always treat as valid in development. Only activate on production domains. |

---

## 7. Confirmed Library Versions

| Library | Version | Key API Confirmed | Notes |
|---------|---------|-------------------|-------|
| Polar API | v1 | `POST /v1/customer-portal/license-keys/validate` | No SDK needed, raw fetch |
| Polar API | v1 | `POST /v1/customer-portal/license-keys/activate` | Activation with label + conditions |
| `@polar-sh/sdk` | latest | `polar.licenseKeys.validate()`, `polar.benefits.create()` | For dashboard tooling only, not bundled in client |
| `jose` | ^5.9.0 | Already in `@tour-kit/license` | **Remove** — no longer needed since Polar handles key signing/validation |

```typescript
// Confirmed via Context7 (2026-03-21)
// Polar License Key Validation — raw fetch, no SDK:
const response = await fetch(
  'https://api.polar.sh/v1/customer-portal/license-keys/validate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: 'TOURKIT-XXXX-XXXX-XXXX',
      organization_id: 'your-org-id',
      activation_id: 'cached-activation-id', // optional
    }),
  }
)
// Response: { id, status, limit_activations, activation, ... }

// Polar License Key Activation:
const activateResponse = await fetch(
  'https://api.polar.sh/v1/customer-portal/license-keys/activate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: 'TOURKIT-XXXX-XXXX-XXXX',
      organization_id: 'your-org-id',
      label: 'app.example.com', // domain as label
      meta: { domain: 'app.example.com' },
    }),
  }
)
// Response: { id, license_key_id, label, meta, ... }
```

---

## 8. Migration Plan (Existing `@tour-kit/license`)

The existing package uses self-signed JWTs with `jose`. The migration to Polar is a **full replacement**, not a layer on top:

| Current (JWT) | New (Polar) |
|---------------|-------------|
| Self-issued JWT with ES256 | Polar-generated license key |
| `jose` dependency (11KB gzipped) | Raw `fetch()` (0 dependencies) |
| Local-only validation | API validation + 24h cache |
| Domain check via JWT claims | Domain check via Polar activations |
| Custom key format (`tk_<jwt>`) | Polar format (`TOURKIT-XXXX-XXXX-XXXX`) |
| No payment integration | Polar handles checkout + billing |

### What Changes

1. **Remove**: `jose` dependency, JWT parsing, public key embedding
2. **Replace**: `validateLicense()` → calls Polar API instead of verifying JWT
3. **Add**: `activateLicense()`, `deactivateLicense()` functions
4. **Add**: localStorage caching layer (24h TTL)
5. **Add**: Development mode detection (localhost bypass)
6. **Keep**: `LicenseProvider`, `LicenseGate`, `useLicense`, `useIsPro` — same public API
7. **Keep**: Types (`LicenseTier`, `LicenseState`, `LicenseContextValue`) — same shape

### Breaking Changes

- `publicKey` prop removed from `LicenseProvider` (no longer needed)
- `organizationId` prop **added** to `LicenseProvider` (required for Polar)
- License key format changes from `tk_<jwt>` to `TOURKIT-XXXX-XXXX-XXXX`
- `LicensePackage` type simplified — Polar doesn't gate per-package, just per-tier

---

## 9. Polar Dashboard Configuration

### Step-by-step Setup

1. **Create Organization** on polar.sh
2. **Create Benefit** → type: `license_keys`
   - Prefix: `TOURKIT`
   - Activations limit: `5`
   - Enable customer admin: `true`
   - Expires: `null` (perpetual for one-time purchase)
3. **Create Product** → "Tour Kit Pro"
   - Type: One-time (`is_recurring: false`)
   - Price: `$99.00` (`price_amount: 9900`)
   - Attach the license key benefit
4. **Create Checkout Link** → embed on `tourkit.dev/pricing`
5. **Configure Webhook** → `tourkit.dev/api/webhooks/polar`
   - Events: `benefit_grant.created`, `benefit_grant.revoked`

### Webhook Handler

```
POST /api/webhooks/polar

Polar signs webhooks with HMAC-SHA256.
Verify using the webhook secret from Polar dashboard.

Events handled:
┌─────────────────────────┬────────────────────────────────────┐
│ Event                   │ Action                             │
├─────────────────────────┼────────────────────────────────────┤
│ benefit_grant.created   │ Send welcome email with:           │
│                         │ - License key                      │
│                         │ - Quick start guide link           │
│                         │ - Support contact                  │
│                         │ Log sale to analytics              │
├─────────────────────────┼────────────────────────────────────┤
│ benefit_grant.revoked   │ Log revocation                     │
│                         │ (Polar auto-disables the key)      │
└─────────────────────────┴────────────────────────────────────┘
```

```typescript
// app/api/webhooks/polar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('webhook-signature')

  // Verify HMAC signature
  const expected = crypto
    .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  switch (event.type) {
    case 'benefit_grant.created': {
      const { customer, benefit } = event.data
      if (benefit.type === 'license_keys') {
        // Send welcome email
        await sendWelcomeEmail({
          email: customer.email,
          name: customer.name,
        })
        // Log sale
        console.log(`[tour-kit] New Pro license: ${customer.email}`)
      }
      break
    }
    case 'benefit_grant.revoked': {
      console.log(`[tour-kit] License revoked: ${event.data.customer.email}`)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

---

## Spec Review Checklist

- [x] Every endpoint has a request + response schema (Polar validate + activate documented)
- [x] Every quality threshold uses a number (< 1ms, < 500ms, < 3KB, > 95%, 0 bytes)
- [x] Every external dependency has a fallback (24h cache + format-only fallback for Polar outage)
- [x] Every risk has a mitigation strategy (5/5 mitigations are specific mechanisms)
- [x] Data model strategy covers all boundaries (Polar response, internal state, cache)
- [x] Library versions confirmed via Context7 (Polar API v1 endpoints confirmed)
- [x] Section 4 adapted to module interface (no HTTP backend — client library)
