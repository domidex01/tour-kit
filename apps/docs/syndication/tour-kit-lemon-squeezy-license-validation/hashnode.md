---
title: "Tour Kit + Lemon Squeezy: handling license validation for Pro features"
slug: "tour-kit-lemon-squeezy-license-validation"
canonical: https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation
tags: react, javascript, web-development, licensing
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation)*

Selling a Pro tier for an open-source React library means you need a way to check whether the person running your code actually paid. Lemon Squeezy ships license key generation and validation as a built-in feature. Setup took us about 3 hours instead of the 2-3 days we budgeted.

We wired Lemon Squeezy's License API to Tour Kit's 8 Pro packages and hit three gotchas worth documenting. This article walks through the working integration: server-side validation in a Next.js API route, client-side caching with a 72-hour TTL, and the activation model quirk that almost cost us a support headache.

## What you'll build

A `useLicenseValidation` hook that calls Lemon Squeezy's License API through your own API route, caches the result in localStorage with a configurable TTL, and gates Pro features behind the validation response. No dedicated licensing server needed.

## The 3 gotchas we hit

1. **The License API is public** — it uses the license key itself as the credential, not your store's API key
2. **Activation limits are lifetime, not concurrent** — deactivating doesn't free a slot, so set limits to 10+
3. **Webhook header is `x-signature`** — not `x-hub-signature` or `stripe-signature`

## Key comparison

| Feature | Lemon Squeezy | Stripe + custom | Keygen.sh |
|---|---|---|---|
| License key generation | Built-in | Manual | Built-in |
| Pricing | 5% + $0.50/txn | 2.9% + $0.30/txn + server | $0-299/mo |
| Merchant of Record | Yes | No | No |

Full article with complete code (Next.js API routes, React hook, webhook handler): [usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation](https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation)
