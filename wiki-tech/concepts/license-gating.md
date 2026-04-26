---
title: License gating
type: concept
sources:
  - ../packages/license/CLAUDE.md
  - ../packages/license/src/components/license-gate.tsx
  - ../packages/license/src/lib/polar-client.ts
  - ../packages/license/src/lib/cache.ts
updated: 2026-04-26
---

*Polar.sh validates the key. The cache holds a 24h-TTL'd verdict. `LicenseGate` and `useLicense()` consume the verdict; Pro packages render fallback UI when invalid.*

## Lifecycle

```
mount LicenseProvider
  ↓
read cache (Zod-validated)
  ↓
fresh? ──yes─→ apply verdict
  │
  no
  ↓
POST Polar /v1/customer-portal/license-keys/validate
  ↓
write cache, apply verdict
```

A cache hit avoids a network round trip. A cache miss or corrupted entry triggers re-validation against Polar.

## License states

```ts
type LicenseState = 'loading' | 'valid' | 'invalid' | 'expired' | 'revoked' | 'error'
```

| State | UI behaviour |
|---|---|
| `loading` | Render fallback (skeleton or null) |
| `valid` | Render Pro children |
| `invalid` / `expired` / `revoked` | Render fallback + watermark |
| `error` | Render fallback; log via `LicenseWarning` |

## Anti-bypass: render key

`LicenseRenderContext` carries a render key set **only** when `status === 'valid'`. `<LicenseGate>` reads the render key and uses it as part of its rendering — so even a JS hack that swaps the context value provides no shortcut without producing a valid render key.

## Domain activation

| Concept | |
|---|---|
| Slots per key | 5 |
| Slot binding | hostname (label) |
| `validateDomainAtRender()` | runtime hostname must match stored activation |
| `isDevEnvironment()` | `localhost`, `127.0.0.1`, `*.local` skip activation |

Dev bypass is hostname-scoped — staging and preview hostnames don't bypass.

## Cache shape

```ts
type LicenseCache = {
  status: LicenseState
  tier: LicenseTier
  validatedAt: number     // ms epoch
  expiresAt: number       // validatedAt + 24h TTL
  domain: string
  // ... validated by Zod on every read
}
```

Cache key: `tourkit-license-{domain}`. Cache integrity check via Zod parse — corrupted entries are cleared and force re-validation.

## Consumer rule

Free packages **must not** import `@tour-kit/license`. The import dependency is the main enforcement mechanism — package.json declares which packages may pull in license.

Pro packages typically expose a `useLicenseCheck()` pattern internally that reads the license context and renders watermarks for invalid licenses.

## Related

- [packages/license.md](../packages/license.md)
- [architecture/dependency-graph.md](../architecture/dependency-graph.md)
- [architecture/client-server-split.md](../architecture/client-server-split.md)
