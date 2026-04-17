## Title: Wiring Lemon Squeezy license validation to a React library – 3 gotchas

## URL: https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation

## Comment to post immediately after:

I'm building Tour Kit, an open-source React product tour library with a Pro tier. Needed license validation without a custom backend.

Lemon Squeezy's License API has three endpoints (activate, validate, deactivate) that use the license key itself as the credential — no API key auth needed. The integration runs through a Next.js API route with a 72-hour localStorage cache on the client.

Three things that tripped me up:

1. Activation limits are lifetime counts, not concurrent. Deactivating doesn't free a slot. If you're selling to developers who switch machines, set limits to 10+.

2. The webhook signature header is `x-signature` (not `stripe-signature`). Wasted 20 minutes on this after copying a Stripe handler.

3. The validate response includes customer email and order details — you need to filter the response before sending it to the client.

Lemon Squeezy charges 5% + $0.50/txn as a Merchant of Record. Stripe is cheaper at 2.9% + $0.30 but you'd need to build your own licensing system. Keygen.sh is dedicated licensing ($0-299/mo) but no MoR.

The article includes working Next.js API routes, a React hook with caching, and a webhook handler for real-time revocation.
