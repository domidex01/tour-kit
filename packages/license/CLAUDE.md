# @tour-kit/license

Polar.sh-based license key validation, domain activation, and React gating components for Tour Kit Pro.

## Package Purpose

Validates license keys against the Polar customer portal API, manages domain activations (up to 5 per key), caches validation results in localStorage with a 24h TTL, and provides React components for conditional rendering based on license status.

## Key Files

- `src/lib/polar-client.ts` — `validateKey()`, `activateKey()`, `deactivateKey()` via raw `fetch()` against Polar API
- `src/lib/cache.ts` — `readCache()`, `writeCache()`, `clearCache()` with 24h TTL, domain-scoped localStorage keys
- `src/lib/domain.ts` — `getCurrentDomain()`, `isDevEnvironment()`, `validateDomainAtRender()` for hostname checks
- `src/lib/schemas.ts` — Zod schemas for Polar API responses and cache shape
- `src/types/index.ts` — `LicenseState`, `LicenseTier`, `LicenseCache`, `LicenseConfig`, error types
- `src/context/license-context.tsx` — `LicenseProvider`, `LicenseContext`, `LicenseRenderContext`
- `src/components/license-gate.tsx` — `<LicenseGate>` with interleaved render-key validation
- `src/components/license-watermark.tsx` — Semi-transparent "UNLICENSED" overlay (inline styles, high z-index)
- `src/components/license-warning.tsx` — Console warning component for invalid licenses
- `src/hooks/use-license.ts` — `useLicense()` context consumer
- `src/hooks/use-is-pro.ts` — `useIsPro()` boolean shortcut
- `src/headless.ts` — Types + lib functions re-exported without React dependency
- `src/index.ts` — Full barrel export (React + headless)

## Domain Concepts

- **License states**: `loading` | `valid` | `invalid` | `expired` | `revoked` | `error`
- **Activation slots**: 5 per key, each bound to a domain label
- **Dev bypass**: `localhost`, `127.0.0.1`, `*.local` skip activation, return `{ valid: true, tier: 'pro' }`
- **Cache integrity**: Zod parse on every read; corrupted entries are cleared and force re-validation
- **Render key**: Anti-bypass mechanism set only when `status === 'valid'`; consumed by `<LicenseGate>`
- **Domain verification**: `validateDomainAtRender()` compares runtime hostname against stored activation

## API Surface

**Headless** (`@tour-kit/license/headless`):
`validateLicenseKey()`, `validateKey()`, `activateKey()`, `deactivateKey()`, `readCache()`, `writeCache()`, `clearCache()`, `getCurrentDomain()`, `isDevEnvironment()`, `validateDomainAtRender()`

**React** (`@tour-kit/license`):
`<LicenseProvider>`, `<LicenseGate>`, `<LicenseWatermark>`, `<LicenseWarning>`, `useLicense()`, `useIsPro()`

## Testing Patterns

- Mock `fetch` globally for Polar API calls (`vi.stubGlobal('fetch', ...)`)
- Mock `localStorage` for cache tests (`vi.stubGlobal('localStorage', ...)`)
- Mock `window.location` for domain detection (`Object.defineProperty(window, 'location', ...)`)
- Use `@testing-library/react` `renderHook()` for hook tests
- Wrap components in `<LicenseProvider>` for component tests

## Common Pitfalls

- Never import `@tour-kit/license` from free packages (`core`, `react`, `hints`)
- Watermark enforcement lives in pro packages via `useLicenseCheck()`, not in this package
- Dev bypass only applies to `localhost`, `127.0.0.1`, and `*.local` — no other hostnames
- `headless.ts` entry point must not import React (tree-shaking boundary)
- `organizationId` is optional in `LicenseProviderProps` but required for Polar validation to work
- Cache keys are domain-scoped: `tourkit-license-{domain}`

## Commands

```bash
pnpm --filter @tour-kit/license build
pnpm --filter @tour-kit/license typecheck
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/license test:coverage
```
