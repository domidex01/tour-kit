## Thread (6 tweets)

**1/** Polar.sh advertises 4% + $0.40 per transaction. The real cost for international customers? ~7.3%.

We just shipped Polar license key validation for Tour Kit Pro. Here's what the docs don't tell you:

**2/** Gotcha #1: Activation limits are LIFETIME, not concurrent.

If your limit is 5 and a customer activates on 5 devices, deactivating one does NOT free a slot.

We almost shipped a "deactivate old device" button. Would have confused every single customer.

**3/** Gotcha #2: The API uses snake_case for request bodies.

The TypeScript SDK uses camelCase. The REST API expects snake_case.

Our first 50 validation calls returned 422 errors because we sent `organizationId` instead of `organization_id`.

**4/** The good part: Polar's customer portal validation endpoint needs NO authentication.

Call it from React, Electron, mobile apps. No API keys exposed client-side. No backend required.

That's the difference between 3 hours of integration and 3 days building a licensing server.

**5/** We built a React hook with 72h localStorage caching:

- Activate once per device
- Validate every 72 hours
- Fall back to cache on network errors
- ~350-500ms first-visit latency, zero after caching

Invalid keys get a watermark, not a hard block.

**6/** Full integration guide with TypeScript code (validation, activation, caching hook, provider pattern):

https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions

Includes an honest cost comparison table: Polar vs Lemon Squeezy at $990, $4,950, and $9,900/month.
