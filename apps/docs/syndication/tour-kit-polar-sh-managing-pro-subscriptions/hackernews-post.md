## Title: Polar.sh license key validation in React: what the docs don't tell you

## URL: https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions

## Comment to post immediately after:

I built an open-source React library (Tour Kit) with a free/pro split. The pro packages need license validation, and Polar.sh handles the payment + key generation side.

The interesting technical detail: Polar's customer portal validation endpoint requires no authentication. You can call it directly from client-side JavaScript without exposing API keys. This matters for library authors because you can't ask your users to set up server-side auth just to validate a license key.

Three gotchas worth knowing about:

- Activation limits are lifetime, not concurrent. Deactivating a device doesn't free a slot. Set limits higher than expected concurrent usage.
- The advertised 4% + $0.40 fee is domestic-only. International transactions cost ~7.3% effective after surcharges.
- The API uses snake_case for request bodies. The TypeScript SDK wraps this, but the REST API docs can mislead you.

The article includes the full React hook (validation + activation + 72h caching) and an honest cost comparison table at different revenue levels.
