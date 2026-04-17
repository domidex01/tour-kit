# How to Add License Validation to a React Library with Lemon Squeezy

## Server-side validation, client caching, and the 3 gotchas we hit

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation)*

Selling a Pro tier for an open-source React library means you need a way to check whether the person running your code actually paid. Most developers reach for Stripe, build a custom licensing server, and spend a week on infrastructure. Lemon Squeezy ships license key generation and validation as a built-in feature. Setup took us about 3 hours.

We wired Lemon Squeezy's License API to Tour Kit's Pro packages. The integration covers server-side validation in Next.js, client-side caching with a 72-hour TTL, and webhook-based revocation. Along the way we hit three gotchas worth sharing.

## Why Lemon Squeezy?

As of April 2026, Lemon Squeezy charges 5% + $0.50 per transaction and includes license key management at no extra cost. It's a full Merchant of Record, so it handles global tax compliance. Stripe charges 2.9% + $0.30 but has zero built-in licensing. Gumroad takes a flat 10%.

The key difference: Lemon Squeezy generates license keys automatically on checkout and exposes 3 API endpoints (activate, validate, deactivate). No custom backend needed.

## The 3 gotchas

**First:** The License API doesn't use your store's API key. It's a public API that uses the license key itself as the credential. No Authorization header needed.

**Second:** Activation limits are lifetime counts, not concurrent. A key with 5 activations gets permanently exhausted after 5 different browsers. Deactivating doesn't free the slot. Set limits to 10+ for developer tools.

**Third:** Webhooks arrive with an x-signature header, not x-hub-signature or stripe-signature. We wasted 20 minutes copying a Stripe handler without changing the header name.

## What we built

The full integration includes Next.js API routes for validation and activation, a React hook with localStorage caching, webhook handlers for real-time revocation, and a provider component that gates Pro features.

Read the full article with working code: [usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation](https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation)

*Submit to: JavaScript in Plain English, Better Programming*
