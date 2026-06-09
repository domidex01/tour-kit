# @tour-kit/license

Polar.sh-based license key validation, domain activation, and React gating components for Tour Kit Pro.

## Package Purpose

Validates license keys against the Polar customer portal API, manages domain activations (up to 5 per key), caches validation results in localStorage with a 72h TTL, and provides React components for conditional rendering based on license status.

## Key Files

- `src/lib/polar-client.ts` — `validateKey()`, `activateKey()`, `deactivateKey()` via raw `fetch()` against Polar API
- `src/lib/cache.ts` — `readCache()`, `writeCache()`, `clearCache()`, `hasFreshCache()` with 72h TTL, domain-scoped localStorage keys, optional `keyHash` binding to invalidate when the license key changes
- `src/lib/domain.ts` — `getCurrentDomain()`, `isDevEnvironment()`, `validateDomainAtRender()` for hostname checks
- `src/lib/schemas.ts` — Zod schemas for Polar API responses and cache shape
- `src/types/index.ts` — `LicenseState`, `LicenseTier`, `LicenseCache`, `LicenseConfig`, error types
- `src/context/license-context.tsx` — `LicenseProvider`, `LicenseContext`, `LicenseRenderContext`
- `src/components/license-gate.tsx` — `<LicenseGate>` soft gate. Renders children unconditionally, layers a single small badge + dev-only warning on non-localhost hosts when unlicensed. Tolerates a missing `<LicenseProvider>`.
- `src/components/pro-gate.tsx` — `<ProGate>` hard gate. Renders a branded placeholder when unlicensed. **Not used internally by Tour Kit's own Pro packages** — kept exported for downstream consumers who want a hard placeholder.
- `src/components/license-watermark.tsx` — Small `Tour Kit · Unlicensed · Buy license` portal badge in the bottom-right corner. Singleton ownership transfer so multiple mounted instances coalesce to one DOM node. Inline-styled, max z-index, link `pointer-events: auto` over a `pointer-events: none` wrapper. Click emits `unlicensed_badge_clicked` via `window.gtag` or `window.dataLayer`.
- `src/components/license-warning.tsx` — Console warning component for invalid licenses
- `src/hooks/use-license.ts` — `useLicense()` context consumer
- `src/hooks/use-is-pro.ts` — `useIsPro()` boolean shortcut
- `src/headless.ts` — Types + lib functions re-exported without React dependency
- `src/index.ts` — Full barrel export (React + headless)

## Domain Concepts

- **License states**: `loading` | `valid` | `invalid` | `expired` | `revoked` | `error`
- **Activation slots**: 5 per key, each bound to a domain label
- **Dev bypass**: `localhost`, `127.0.0.1`, `*.local` skip activation, return `{ valid: true, tier: 'pro', renderKey: 'dev_bypass' }`
- **Preview bypass**: ephemeral hosts (`isEphemeralHost()` — Vercel/Netlify/Cloudflare preview URLs, dev tunnels, raw IPs) skip activation, return `{ valid: true, tier: 'pro', renderKey: 'preview_bypass' }` so throwaway deploy URLs never consume a slot. Bare production aliases (e.g. `project.vercel.app`) are NOT ephemeral and still validate
- **Activation-limit grace**: a `granted` key whose auto-activation 403s (limit reached) resolves to `status: 'valid'` (Pro stays unlocked) plus a one-time console warning — never the unlicensed watermark. The cap is a vendor signal, not a customer-facing gate
- **Cache integrity**: Zod parse on every read; corrupted entries are cleared and force re-validation
- **Render key**: Set only when `status === 'valid'`. Exposed via `LicenseRenderContext` from `LicenseProvider` for any future anti-bypass consumer
- **Soft gate vs hard gate**: `<LicenseGate>` is the canonical internal gate used by all Tour Kit Pro packages — it never hides the real UI, only layers a badge. `<ProGate>` is a legacy hard-placeholder export kept for downstream consumers
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
- Dev bypass applies only to `localhost`, `127.0.0.1`, and `*.local`; ephemeral/preview hosts get the separate **preview bypass** via `isEphemeralHost()`. Neither path consumes a Polar activation slot
- A `403` from `activateKey` means the key is valid but out of slots — do NOT map it to `invalid`/watermark. It is handled in `validateLicenseKey` step 5a as a valid Pro state. Only a `403`/`404` from the `validate` call (not `activate`) is unlicensed
- `headless.ts` entry point must not import React (tree-shaking boundary)
- `organizationId` is optional in `LicenseProviderProps` but required for Polar validation to work
- Cache keys are domain-scoped: `tourkit:license:{domain}`

## Commands

```bash
pnpm --filter @tour-kit/license build
pnpm --filter @tour-kit/license typecheck
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/license test:coverage
```
