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
- `src/lib/watermark-dom.ts` — **the badge itself**, framework-free. Builds the bottom-right `userTourKit · Unlicensed · Remove from $9.99` node, inline-styled, max z-index, link `pointer-events: auto` over a `pointer-events: none` wrapper; click emits `unlicensed_badge_clicked` via `window.gtag` or `window.dataLayer`. `mountWatermark()` holds a count, not an owner — the badge appears on the first hold and survives every release but the last, so any number of packages asking still yields one node. Also holds `warnUnlicensed()` and its once-per-page-load guard.
- `src/lib/license-gate-dom.ts` — `startLicenseGate()`, `<LicenseProvider>` + `<LicenseGate>` collapsed into one React-free call for `@tour-kit/vue` and `@tour-kit/svelte`. Same branch order as the React pair.
- `src/components/license-watermark.tsx` — React binding over `mountWatermark()`. Renders `null`.
- `src/components/license-warning.tsx` — React binding over `warnUnlicensed()`. Renders `null`.
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

**Headless** (`@tour-kit/license/headless`) — React-free, and the entry the Vue and Svelte bindings load:
`validateLicenseKey()`, `validateKey()`, `activateKey()`, `deactivateKey()`, `readCache()`, `writeCache()`, `clearCache()`, `getCurrentDomain()`, `isDevEnvironment()`, `validateDomainAtRender()`, `startLicenseGate()`, `mountWatermark()`, `warnUnlicensed()`

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
- **React-bearing types live in `src/types/react.ts`, never `src/types/index.ts`.** tsup's dts pass rolls every type module both entries reach into ONE shared declaration chunk that `headless.d.ts` imports — `splitting: false` does not apply to declarations. A `ReactNode` declared next to `LicenseState` therefore travelled into the React-free door and resolved to nothing, so a Vue app on `skipLibCheck: false` with no `@types/react` got `TS2503: Cannot find namespace 'React'` from inside `node_modules`. `headless-dts-has-no-react.test.ts` walks the built closure, with a positive control against `index.d.ts`
- **`process.env.NODE_ENV` is written bare, inside a `try`.** Bare because that exact token is what bundlers substitute — writing `process.env?.NODE_ENV` stops esbuild/webpack/Vite matching it, so the comparison survives minification and the branch it guards is never eliminated. Inside a `try` because an undeclared `process` throws a catchable `ReferenceError` when this module is loaded unbundled. A `typeof process !== 'undefined' &&` prefix fails open in exactly the Vite browser builds the Vue and Svelte bindings target
- **The badge is built with `createElement` and `DOMParser`, never `innerHTML`.** It is constructed inside the consumer's mount hook — in Svelte, one statement before the cleanup closure is returned — so a Trusted Types CSP refusing the assignment would leak every listener the provider had already attached. `mountWatermark` also wraps construction in try/catch: no badge beats a broken host
- **`mountWatermark` re-checks `node.isConnected`.** Trusting the cached pointer made the badge sticky-OFF — anything that detached it (a router clearing `document.body`, a devtools delete) left the pointer non-null forever, so one `remove()` bought a whole session un-badged
- `headless.ts` entry point must not import React (tree-shaking boundary). It is no longer only a tree-shaking concern: `@tour-kit/vue` and `@tour-kit/svelte` depend on this package and have no React installed, which is why `react`/`react-dom` are **optional** peers here
- The badge sets styles with `setProperty` per declaration, never `style.cssText`. jsdom's shorthand parser drops every declaration after `background: rgba(...)` + `color: #fff` — measured, the whole string came back empty — which silently un-styles the badge in every test environment while browsers stay fine
- `console.warn` in `lib/watermark-dom.ts` is allowed by an explicit path entry in `tooling/biome/biome.json`. Move the warning and the allowlist entry moves with it
- `organizationId` is optional in `LicenseProviderProps` but required for Polar validation to work
- Cache keys are domain-scoped: `tourkit:license:{domain}`

## Commands

```bash
pnpm --filter @tour-kit/license build
pnpm --filter @tour-kit/license typecheck
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/license test:coverage
```
