# How We Handle License Keys for an Open-Source React Library

## Using Polar.sh to gate Pro features without building a licensing server

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions)*

Selling a Pro tier for an open-source React library means checking whether the person running your code actually paid. Most developers reach for Stripe, build a custom licensing server, and spend a week on infrastructure that has nothing to do with their product.

We went with Polar.sh instead. It auto-generates license keys on purchase and exposes a validation endpoint that requires no authentication. You can call it directly from a React component. No backend, no API keys in your client bundle.

This article covers the full integration: client-side validation with the `@polar-sh/sdk`, a React hook with 72-hour localStorage caching, and the three gotchas that almost burned us (snake_case API bodies, lifetime activation limits, and hidden international fees).

## The key insight: client-side validation without auth

Polar's customer-portal validation endpoint (`POST /v1/customer-portal/license-keys/validate`) needs no bearer token. You send the license key and your organization ID, and it returns `granted`, `revoked`, or `disabled`. Safe to call from browsers, Electron apps, or mobile.

This is the difference between "3 hours of integration work" and "3 days building a licensing server."

## The gotcha that matters: lifetime activation limits

Polar activation limits are lifetime, not concurrent. If your limit is 5 and a customer activates on 5 devices, deactivating one does NOT free a slot. We almost shipped a "deactivate old device" button that would have confused every customer.

Set your activation limits higher than expected concurrent usage. We use 5 for individual developers and offer limit resets through support.

## The honest cost

Polar advertises 4% + $0.40 per transaction. But add +1.5% for international cards and +0.5% for subscriptions, and a $30 international subscription effectively costs ~7.3% in fees. Lemon Squeezy's all-in 5% + $0.50 is simpler to predict.

We went with Polar anyway because client-side validation and an Apache 2.0 open-source codebase matter more for a library than saving 2% on fees.

Full article with TypeScript code examples, comparison tables, and the complete React hook: [usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions](https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions)

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
