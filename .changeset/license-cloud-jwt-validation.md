---
'@tour-kit/license': minor
---

Add Cloud SDK JWT validation path for tokens minted by the Tour Kit dashboard (Plan 12C §12C.11).

`validateLicenseKey()` now routes EdDSA-signed JWTs through `validateCloudToken()` before the Polar path. A paying Cloud customer can mint a JWT in their dashboard's `Settings → SDK tokens`, paste it into `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` / `VITE_TOUR_KIT_LICENSE_KEY`, and their Pro SDK packages light up without a separate Polar checkout. Existing `TOURKIT-` Polar keys keep working unchanged — the discriminator (`isCloudToken`) is purely structural.

Verification steps follow Plan 12C §12C.11: decode header → hard-pin `alg=EdDSA` and `typ=JWT` (no algorithm dispatch — the verifier is hardcoded to Ed25519) → require HTTPS issuer (except localhost for self-host dev) → fetch JWKS from `${iss}/.well-known/jwks.json` with 1h cache → verify signature via `@noble/ed25519` (Web Crypto's native EdDSA only landed in Chrome 137, so polyfill keeps ~21% of users from breaking — Plan 12C D7) → enforce `exp` → fetch revocation list with 15min cache (fails open for revocation only on network failure; signature and expiry still fail closed) → enforce `aud` against current hostname (empty `aud` allowed with warning; localhost / 127.0.0.1 / *.local always pass).

New exports from `@tour-kit/license` and `@tour-kit/license/headless`: `isCloudToken(key)`, `validateCloudToken(token)`. Adds `@noble/ed25519` (≈5 KB gz) as a direct dependency.

Three regression test suites guard the security boundary: signature/expiry/revocation/aud happy-and-sad paths; algorithm-confusion forgery (HS256/RS256/none rejected before any signature work and before any network fetch); and a static check that no file in `src/` ever calls `subtle.verify` with an Ed25519 algorithm name.
