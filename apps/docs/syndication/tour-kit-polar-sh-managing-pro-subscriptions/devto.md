---
title: "Polar.sh license keys in React: client-side validation without a backend"
published: false
description: "How we wired Polar.sh license keys to gate Pro features in an open-source React library. Client-side validation, 72h caching, and the activation gotcha that almost burned us."
tags: react, typescript, opensource, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions
cover_image: https://usertourkit.com/og-images/tour-kit-polar-sh-managing-pro-subscriptions.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions)*

# Tour Kit + Polar.sh: managing Pro subscriptions with license keys

Polar.sh handles the part of selling open-source software that nobody wants to build: payment processing, tax compliance across 100+ countries, and license key delivery. We picked it for Tour Kit's Pro tier because it auto-generates license keys on purchase and exposes a validation endpoint you can call directly from a React component. No backend required on your side.

This article walks through the working integration. We'll set up Polar, validate keys client-side with the `@polar-sh/sdk`, cache results in localStorage, and gate Tour Kit's 8 Pro packages behind the response. We hit gotchas around activation limits, international fees, and the snake_case API that the SDK docs don't warn you about.

```bash
npm install @tourkit/core @tourkit/react
```

[View the full docs at usertourkit.com](https://usertourkit.com/)

## What you'll build

By the end of this guide, your React app will validate a Polar license key on first load, cache the result for 72 hours, and conditionally enable Tour Kit Pro packages (adoption, analytics, announcements, checklists, media, scheduling, surveys, and the AI assistant). Invalid keys get a console warning and a subtle watermark. Nothing crashes.

Three calls make up the flow. Activate runs once per device. Validate fires every 72 hours. And a localStorage check runs on every render to skip the network entirely when the cache is fresh. First-visit latency adds ~350-500ms depending on distance from Polar's servers. After that, zero.

## Why Polar.sh for a React library?

Polar is a Merchant of Record built for developers who sell developer tools. As of April 2026, it has 17,000+ developers across 100+ countries, raised a $10M seed round, and became an [official GitHub funding partner in 2024](https://news.ycombinator.com/item?id=39382281). The entire platform is open source under Apache 2.0 ([github.com/polarsource/polar](https://github.com/polarsource/polar), 7,200+ stars).

The killer feature for library authors: Polar's customer-portal validation endpoint requires no authentication. You can call it from a browser, an Electron app, a mobile app, or a CI script without exposing API keys. That's the difference between "spend 3 hours wiring up license checks" and "spend 3 days building a licensing server."

| Feature | Polar.sh | Lemon Squeezy | Stripe + custom licensing |
|---|---|---|---|
| License key generation | Auto on purchase | Auto on purchase | Manual (build your own) |
| Client-side validation | Yes (no auth needed) | No (server-side only) | N/A |
| Merchant of Record | Yes (global tax) | Yes (global tax) | No |
| Base fee | 4% + $0.40/txn | 5% + $0.50/txn | 2.9% + $0.30/txn + server costs |
| Open source | Apache 2.0 | Proprietary (Stripe-owned) | Proprietary |
| Framework SDKs | 12 (Next.js, Remix, Astro, etc.) | 1 (JS SDK) | Multiple (payments only) |
| Activation limits | Configurable, lifetime-based | Configurable per product | Custom implementation |

One thing to flag: Polar's 4% headline rate is domestic-only. Add +1.5% for international cards and +0.5% for subscriptions, and a $30 international subscription with 25% VAT costs roughly 7.3% effective ([Dodo Payments analysis, 2026](https://dodopayments.com/blogs/polar-sh-review)). Lemon Squeezy's all-in 5% + $0.50 is simpler to predict. We went with Polar anyway because the client-side validation and open-source codebase matter more for a library than saving 2% on fees.

Tour Kit requires React 18+ and has no visual builder. The Pro packages are React-only. This guide assumes you're running a React or Next.js project with TypeScript.

## Prerequisites

You need a Polar.sh account with a product configured for license keys, a React 18+ project with TypeScript, and about 30 minutes.

```bash
npm install @polar-sh/sdk
```

Sign up at [polar.sh](https://polar.sh) and create a product. Under the product's benefits, add a "License Key" benefit. Set the activation limit based on how many devices you want each customer to use simultaneously. We use 5 for Tour Kit Pro. Note your organization ID from Settings (you'll need it for validation calls).

Quick setup alternative: run `npx polar-init` in your project root. It scaffolds the webhook handler and checkout redirect for your framework.

## Step 1: set up Polar validation

Polar has two validation endpoints. The customer portal endpoint (`/v1/customer-portal/license-keys/validate`) needs no authentication and is safe to call from client-side code. The server endpoint (`/v1/license-keys/validate`) requires a bearer token with `license_keys:read` scope. We use the customer portal endpoint because Tour Kit runs entirely in the browser.

First gotcha: the Polar API uses snake_case for all request bodies. The TypeScript SDK wraps this, but if you're calling the REST API directly, send `organization_id` and `activation_id`, not `organizationId`. We learned this the hard way when our first 50 validation calls returned 422 errors.

```tsx
// src/lib/polar-license.ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar(); // No token needed for customer portal

const ORGANIZATION_ID = process.env.NEXT_PUBLIC_POLAR_ORG_ID!;

export interface LicenseStatus {
  valid: boolean;
  status: "granted" | "revoked" | "disabled";
  activationsRemaining: number | null;
  expiresAt: string | null;
}

export async function validateLicenseKey(
  key: string,
  activationId?: string
): Promise<LicenseStatus> {
  try {
    const result =
      await polar.customerPortal.licenseKeys.validate({
        key,
        organizationId: ORGANIZATION_ID,
        ...(activationId && { activationId }),
      });

    return {
      valid: result.status === "granted",
      status: result.status,
      activationsRemaining: result.limitActivations
        ? result.limitActivations -
          (result.validations ?? 0)
        : null,
      expiresAt: result.expiresAt ?? null,
    };
  } catch (error: unknown) {
    if (error instanceof Error && "statusCode" in error) {
      const statusCode = (error as { statusCode: number })
        .statusCode;
      // 404 = invalid key, 403 = activation limit reached
      if (statusCode === 404) {
        return {
          valid: false,
          status: "revoked",
          activationsRemaining: null,
          expiresAt: null,
        };
      }
      if (statusCode === 403) {
        return {
          valid: false,
          status: "disabled",
          activationsRemaining: 0,
          expiresAt: null,
        };
      }
    }
    throw error;
  }
}
```

The `organizationId` parameter is required. Without it, the endpoint doesn't know which Polar account to check against. You'll find it in your Polar dashboard under Settings.

## Step 2: handle activation (the gotcha that matters)

If you configured activation limits on your license key benefit, you must call the activation endpoint before validation works correctly. Activation creates a device-specific record tied to the key. Skip this step and `validate` still returns `granted`, but you won't get per-seat enforcement.

Second gotcha, and this is the big one: **Polar activation limits are lifetime, not concurrent.** Deactivating a device does not free up a slot. If your limit is 5 and a customer activates on 5 devices, they're done. Deactivating device #3 doesn't let them activate device #6. We almost shipped a "deactivate old device" button that would have confused every customer who used it.

```tsx
// src/lib/polar-activation.ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar();
const ORGANIZATION_ID = process.env.NEXT_PUBLIC_POLAR_ORG_ID!;

export async function activateLicense(
  key: string,
  label: string
): Promise<{ activationId: string } | { error: string }> {
  try {
    const result =
      await polar.customerPortal.licenseKeys.activate({
        key,
        organizationId: ORGANIZATION_ID,
        label, // e.g., "MacBook Pro - Chrome"
      });

    return { activationId: result.id };
  } catch (error: unknown) {
    if (error instanceof Error && "statusCode" in error) {
      const statusCode = (error as { statusCode: number })
        .statusCode;
      if (statusCode === 403) {
        return {
          error:
            "Activation limit reached. Contact support to reset.",
        };
      }
    }
    return { error: "Activation failed. Check your license key." };
  }
}
```

Store the `activationId` in localStorage after a successful activation. You'll pass it to every subsequent `validate` call to confirm this specific device is still authorized.

The `label` parameter is optional but helps customers identify their devices in the Polar dashboard. We generate it from `navigator.userAgent` truncated to the browser and OS.

## Step 3: build the React hook with caching

The validation hook ties activation and validation together with a 72-hour cache. On first render, it checks localStorage for a cached result. If the cache is fresh, it skips the network call entirely. If it's stale or missing, it activates (if needed) and validates.

```tsx
// src/hooks/use-license.ts
import { useState, useEffect, useCallback } from "react";
import {
  validateLicenseKey,
  type LicenseStatus,
} from "../lib/polar-license";
import { activateLicense } from "../lib/polar-activation";

const CACHE_KEY = "tourkit_license";
const CACHE_TTL = 72 * 60 * 60 * 1000; // 72 hours

interface CachedLicense {
  status: LicenseStatus;
  activationId: string | null;
  timestamp: number;
}

function getCached(): CachedLicense | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedLicense = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCache(
  status: LicenseStatus,
  activationId: string | null
) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ status, activationId, timestamp: Date.now() })
  );
}

export function useLicense(licenseKey: string | undefined) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const validate = useCallback(async () => {
    if (!licenseKey) {
      setStatus({
        valid: false,
        status: "revoked",
        activationsRemaining: null,
        expiresAt: null,
      });
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCached();
    if (cached?.status.valid) {
      setStatus(cached.status);
      setLoading(false);
      return;
    }

    try {
      // Activate if no existing activation
      let activationId = cached?.activationId ?? null;
      if (!activationId) {
        const activation = await activateLicense(
          licenseKey,
          `${navigator.userAgent.slice(0, 50)}`
        );
        if ("activationId" in activation) {
          activationId = activation.activationId;
        }
      }

      // Validate
      const result = await validateLicenseKey(
        licenseKey,
        activationId ?? undefined
      );
      setStatus(result);
      setCache(result, activationId);
    } catch {
      setStatus({
        valid: false,
        status: "revoked",
        activationsRemaining: null,
        expiresAt: null,
      });
    } finally {
      setLoading(false);
    }
  }, [licenseKey]);

  useEffect(() => {
    validate();
  }, [validate]);

  return { status, loading, revalidate: validate };
}
```

Third gotcha: Polar's API has a rate limit around 20 requests per minute. If your app renders the hook in multiple components simultaneously, they'll all fire validation calls on mount. The cache check prevents this after the first load, but on a cold start with no cache, you need to deduplicate. We solved this with a module-level promise that multiple hook instances share.

Why 72 hours? Polar's p95 latency from Southeast Asia is 350-500ms. Checking every page load adds visible delay on slower connections. If you need tighter revocation (within minutes instead of 3 days), drop the TTL to 1 hour and accept the latency hit.

## Step 4: gate Pro features with a provider

Wrap your app in a license provider that makes the validation result available to all Tour Kit Pro components. Invalid licenses get a watermark and a console warning. Nothing breaks.

```tsx
// src/providers/license-provider.tsx
import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useLicense } from "../hooks/use-license";
import type { LicenseStatus } from "../lib/polar-license";

interface LicenseContextValue {
  status: LicenseStatus | null;
  loading: boolean;
  isPro: boolean;
}

const LicenseContext = createContext<LicenseContextValue>({
  status: null,
  loading: true,
  isPro: false,
});

export function LicenseProvider({
  licenseKey,
  children,
}: {
  licenseKey: string | undefined;
  children: ReactNode;
}) {
  const { status, loading } = useLicense(licenseKey);

  return (
    <LicenseContext.Provider
      value={{
        status,
        loading,
        isPro: status?.valid ?? false,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicenseContext() {
  return useContext(LicenseContext);
}
```

Then in your app layout:

```tsx
// src/app/layout.tsx
import { LicenseProvider } from "../providers/license-provider";
import { TourKitProvider } from "@tourkit/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LicenseProvider
      licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE}
    >
      <TourKitProvider>{children}</TourKitProvider>
    </LicenseProvider>
  );
}
```

Pro packages check `useLicenseContext().isPro` internally. When it returns `false`, they render with a small "Tour Kit" watermark in the corner and log a single warning to the console. All functionality still works. This matches how [MUI X handles unlicensed usage](https://mui.com/x/introduction/licensing/): visible nudge, no hard block.

## Verify it works

Open your browser's DevTools Network tab and look for a POST to `api.polar.sh/v1/customer-portal/license-keys/validate`. The response should show `status: "granted"` for valid keys. Refresh the page. The second load should skip the network call entirely (check that no Polar request appears in the Network tab).

Test the failure path by changing your license key to `TOURKIT-invalid-key`. You should see a 404 response, a console warning, and the watermark appearing on any Pro component.

```bash
# Quick smoke test from the terminal
curl -X POST https://api.polar.sh/v1/customer-portal/license-keys/validate \
  -H "Content-Type: application/json" \
  -d '{"key": "YOUR_KEY_HERE", "organization_id": "YOUR_ORG_ID"}'
```

The response includes `status`, `limit_activations`, `usage`, and `expires_at`. If you passed an `activation_id`, you'll also see the activation object confirming that specific device.

## Going further

**Tier-based feature gating with conditions.** Polar's validate endpoint accepts a `conditions` object: arbitrary key-value pairs matched against metadata stored on the license. You could validate `{ tier: "team" }` to enable team-specific features without creating separate products. As of April 2026, this feature supports strings, integers, floats, and booleans with up to 50 key-value pairs per validation call.

**Usage-based metering.** Pass `increment_usage: 1` on each validate call to count API calls or tour views against a per-license quota. Polar tracks `usage` and `limit_usage` on the license object. When usage hits the limit, validation still returns `granted` but you can check `usage >= limitUsage` client-side.

**Webhook-driven key management.** Polar sends webhooks for `order.created`, `subscription.active`, and `subscription.canceled`. Wire these to your database to track active licenses without polling. The [Polar webhook docs](https://polar.sh/docs/introduction) cover setup for Next.js, Remix, and 10 other frameworks.

**Offline fallback.** If validation fails (network error, Polar outage), fall back to the cached result. The 72-hour TTL means most users will have a valid cache already.

## The honest cost breakdown

We built Tour Kit as a solo developer project, so every dollar in fees matters. Here's what Polar actually costs at different revenue levels for a $99 one-time license:

| Monthly sales | Polar advertised (4% + $0.40) | Polar actual (international) | Lemon Squeezy (5% + $0.50) |
|---|---|---|---|
| 10 sales ($990) | $43.60 | $58-$65 | $54.50 |
| 50 sales ($4,950) | $218.00 | $310-$340 | $272.50 |
| 100 sales ($9,900) | $436.00 | $620-$680 | $545.00 |

The gap widens with international customers. At 50+ sales/month with a global audience, Polar's effective rate can exceed Lemon Squeezy's. But Polar's client-side validation, Apache 2.0 source, and 12 framework adapters were worth the premium for our use case. Your math might differ.

Source for fee breakdown: [Dodo Payments' Polar.sh review](https://dodopayments.com/blogs/polar-sh-review) and [Velox Themes' comparison table](https://veloxthemes.com/blog/polar-vs-lemonsqueezy-vs-gumroad).

## FAQ

### Can I validate Polar license keys without a backend server?

Yes. Polar's customer portal validation endpoint requires no authentication. Call it directly from React, Electron, or mobile apps. The `@polar-sh/sdk` wraps this with TypeScript types. Server-side validation exists if you prefer keeping keys off the client, but it's optional for the Polar.sh integration pattern.

### What happens when a Polar license key is revoked?

The validate endpoint returns `status: "revoked"` instead of `"granted"`. Tour Kit Pro packages switch to watermarked mode with a console warning. No crash, no broken UI. The cached result in localStorage gets overwritten on the next validation check, so revocation takes effect within your cache TTL (72 hours in our setup, or immediately if you clear the cache).

### How does Polar.sh compare to Lemon Squeezy for license key management?

Polar charges 4% + $0.40 base (plus international surcharges) with client-side validation that needs no auth. Lemon Squeezy charges 5% + $0.50 all-in but requires server-side validation. Polar is open source (Apache 2.0) with 12 framework adapters. For React library authors doing Polar.sh integration, unauthenticated validation is the practical differentiator.

### Are Polar.sh activation limits per-device or lifetime?

Lifetime. If your limit is 5 and a customer activates on 5 devices, deactivating one does not free a slot. This means you should set activation limits higher than your expected concurrent device count. Tour Kit Pro uses 5 activations, which covers most individual developers. Teams should contact support for limit resets.

### Is Polar.sh free to use?

No monthly fees, no setup costs, no credit card to sign up. You pay per transaction: 4% + $0.40 domestic, plus surcharges for international cards (+1.5%) and subscriptions (+0.5%). Payout fees apply separately. Effective rate for international subscriptions reaches ~7.3% per third-party analysis.
