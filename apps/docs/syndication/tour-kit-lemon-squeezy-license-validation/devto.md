---
title: "How I wired Lemon Squeezy license validation to a React component library (3 gotchas)"
published: false
description: "Server-side validation, 72-hour client caching, and the activation limit quirk that almost cost us a support nightmare. Full working code included."
tags: react, javascript, typescript, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation
cover_image: https://usertourkit.com/og-images/tour-kit-lemon-squeezy-license-validation.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation)*

Selling a Pro tier for an open-source React library means you need a way to check whether the person running your code actually paid. Most developers reach for Stripe, build a custom licensing server, and spend a week on infrastructure that has nothing to do with their product. Lemon Squeezy ships license key generation and validation as a built-in feature. Setup took us about 3 hours instead of the 2-3 days we budgeted.

We wired Lemon Squeezy's License API to Tour Kit's 8 Pro packages and hit three gotchas worth documenting. This article walks through the working integration: server-side validation, client-side caching with a 72-hour TTL, and the activation model quirk that almost cost us a support headache.

## Why Lemon Squeezy for license validation?

Lemon Squeezy is a Merchant of Record platform that handles payment processing, tax compliance, and software licensing in one dashboard. As of April 2026, it charges 5% + $0.50 per transaction and includes license key management at no extra cost. Stripe acquired Lemon Squeezy in July 2024, which adds stability but raises questions about whether the product will merge into Stripe's own MoR beta. Gumroad charges a flat 10% per transaction by comparison.

The advantage for library authors: Lemon Squeezy generates license keys automatically on checkout and exposes 3 API endpoints for validation. No custom backend required. Stripe charges 2.9% + $0.30 per transaction but has zero built-in licensing.

| Feature | Lemon Squeezy | Stripe + custom | Keygen.sh |
|---|---|---|---|
| License key generation | Built-in, automatic | Manual (build your own) | Built-in |
| Validation API | 3 endpoints | N/A (build your own) | Full REST API |
| Merchant of Record | Yes | No | No |
| Pricing | 5% + $0.50/txn | 2.9% + $0.30/txn + server | $0-299/mo |

## The 3 gotchas

**Gotcha 1:** The License API doesn't use your store's API key for authentication. It's a public API that uses the license key itself as the credential. No `Authorization` header needed.

**Gotcha 2:** Activation limits are lifetime counts, not concurrent. A key with 5 activations gets permanently exhausted after 5 different browsers, even if you deactivate some. Set activation limits to 10+ for developer tools.

**Gotcha 3:** Webhooks use an `x-signature` header (not `x-hub-signature` or `stripe-signature`). We wasted 20 minutes on signature verification failures because we copied a Stripe handler.

## Full code walkthrough

The article includes complete working code for:
- Next.js API routes for `/api/license/validate` and `/api/license/activate`
- A `useLicenseValidation` React hook with localStorage caching
- Webhook handler for real-time license revocation
- Provider component that gates Pro features behind validation

Full article with all code examples: [usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation](https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation)
