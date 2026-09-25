---
'@tour-kit/license': patch
---

Skip the issuer call when no domain is available (SSR/edge/jobs). Server environments cannot read or write the domain-scoped cache and can never claim an activation, so validation could only ever land in the error state — after burning one issuer request per boot. One forgotten SSR deployment generated 14,883 Polar validations this way. Returned state is unchanged; only the guaranteed-wasted network call is gone.
