---
title: "@tour-kit/license"
type: package
package: "@tour-kit/license"
version: 1.0.2
sources:
  - ../packages/license/CLAUDE.md
  - ../packages/license/package.json
  - ../packages/license/src/index.ts
updated: 2026-04-26
---

*Polar.sh-based license validation, domain activation (5 slots per key), localStorage caching (24h TTL), and React gating components for Tour Kit Pro.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/license` |
| Version | 1.0.2 |
| Tier | Infrastructure (used by all Pro packages) |
| Deps | `zod` |
| Peer | `react`, `react-dom` |
| Entry points | `.` (React + headless), `./headless` (no React) |

The split entry point is a hard tree-shaking boundary: `headless.ts` must not import React.

## Public API

### Components

```ts
LicenseProvider          // wraps app; performs validation
LicenseGate              // children render only on valid license
LicenseWatermark         // semi-transparent "UNLICENSED" overlay
LicenseWarning           // console warning helper
ProGate                  // alias for LicenseGate semantics
```

Prop types: `LicenseGateProps`, `LicenseWarningProps`, `ProGateProps`.

### Hooks

```ts
useLicense()       → LicenseContextValue   // throws if no provider
useIsPro()         → boolean
useLicenseGate()   → LicenseGateResult
```

### Headless utilities

```ts
validateLicenseKey(key, options)
isDevEnvironment()           // true on localhost / 127.0.0.1 / *.local
getCurrentDomain()
```

Exposed at `@tour-kit/license/headless`:

```ts
validateLicenseKey, validateKey, activateKey, deactivateKey,
readCache, writeCache, clearCache,
getCurrentDomain, isDevEnvironment, validateDomainAtRender
```

### Types

```ts
LicenseTier, LicenseState, LicenseError, LicenseActivation, LicenseCache,
LicenseConfig, LicenseContextValue, LicenseProviderProps,
LicenseGateProps, LicenseWarningProps,
PolarValidateResponse, PolarActivateResponse
```

## Domain concepts

| Concept | Behaviour |
|---|---|
| **License states** | `loading` \| `valid` \| `invalid` \| `expired` \| `revoked` \| `error` |
| **Activation slots** | 5 per key; each bound to a domain label |
| **Dev bypass** | `localhost`, `127.0.0.1`, `*.local` skip activation; `{ valid: true, tier: 'pro' }` |
| **Cache integrity** | Zod-parsed on every read; corrupted entries are cleared and force re-validation |
| **Render key** | Anti-bypass mechanism set only when `status === 'valid'`; `<LicenseGate>` consumes it |
| **Domain verification** | `validateDomainAtRender()` compares runtime hostname against stored activation |

## Source layout

```
src/
├── index.ts                              # React + headless barrel
├── headless.ts                           # No-React tree-shaking entry
├── lib/
│   ├── polar-client.ts                   # validateKey, activateKey, deactivateKey
│   ├── cache.ts                          # readCache, writeCache, clearCache (24h TTL)
│   ├── domain.ts                         # getCurrentDomain, isDevEnvironment, validateDomainAtRender
│   └── schemas.ts                        # Zod schemas for Polar API + cache
├── context/license-context.tsx           # LicenseProvider, LicenseContext, LicenseRenderContext
├── components/
│   ├── license-gate.tsx                  # interleaved render-key validation
│   ├── license-watermark.tsx             # inline-styled overlay
│   ├── license-warning.tsx
│   └── pro-gate.tsx
├── hooks/
│   ├── use-license.ts
│   ├── use-is-pro.ts
│   └── use-license-gate.ts
└── types/index.ts
```

## Integration with other packages

All Pro packages depend on `@tour-kit/license`:

- `@tour-kit/adoption`, `@tour-kit/ai`, `@tour-kit/analytics`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/media`, `@tour-kit/scheduling`, `@tour-kit/surveys`

Free packages **must not** import this package: `@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`.

Watermark enforcement lives in **Pro packages** via a `useLicenseCheck()` pattern, not in this package.

## Gotchas

- **Dev bypass is hostname-scoped.** Only `localhost`, `127.0.0.1`, and `*.local` bypass. `staging.example.com` does not — even in development.
- **`headless.ts` ≠ `index.ts`.** Don't accidentally import React-using modules from the headless entry — it breaks tree-shaking.
- **`organizationId` is technically optional** in `LicenseProviderProps` but required for Polar validation to work.
- **Cache keys are domain-scoped:** `tourkit-license-{domain}`.
- **Test patterns:** mock `fetch` (`vi.stubGlobal('fetch', ...)`) for Polar; mock `localStorage` and `window.location` for domain/cache tests.

## Related

- [overview.md](../overview.md) — free vs Pro tier split
- [packages/core.md](core.md) — used internally for storage adapter helpers
- [concepts/license-gating.md](../concepts/license-gating.md)
