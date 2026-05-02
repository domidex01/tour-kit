# @tour-kit/license

> License key validation and activation for Tour Kit Pro packages — Polar.sh-backed key verification with offline cache, domain activation, render-time gating, and watermark enforcement.

[![npm version](https://img.shields.io/npm/v/@tour-kit/license.svg)](https://www.npmjs.com/package/@tour-kit/license)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/license.svg)](https://www.npmjs.com/package/@tour-kit/license)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/license?label=gzip)](https://bundlephobia.com/package/@tour-kit/license)
[![types](https://img.shields.io/npm/types/@tour-kit/license.svg)](https://www.npmjs.com/package/@tour-kit/license)

The runtime validator that gates **Tour Kit Pro** packages. Validates license keys against the [Polar.sh](https://polar.sh/) customer portal, activates up to 5 domains per key, caches results in `localStorage` with a 72h TTL, and provides React components + hooks for conditional rendering based on license status.

**Required by:** `@tour-kit/adoption`, `@tour-kit/ai`, `@tour-kit/analytics`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/media`, `@tour-kit/scheduling`, `@tour-kit/surveys`.

**Free packages do not need this:** `@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints` work without a license.

## Features

- **Polar.sh validation** — license keys generated and managed via Polar customer portal
- **Domain activation** — 5 slots per key; bound to hostname
- **Offline cache** — `localStorage`-backed, 72h TTL, Zod-validated reads
- **Dev bypass** — `localhost`, `127.0.0.1`, `*.local` skip activation automatically
- **`<LicenseGate>`** — conditionally render Pro features
- **`<LicenseWatermark>`** — semi-transparent "UNLICENSED" overlay enforcement
- **Headless entry** — `@tour-kit/license/headless` for non-React / server-side validation
- **Render-key anti-bypass** — interleaved validation prevents trivial DevTools tampering
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/license
# or
pnpm add @tour-kit/license
```

## Quick Start

```tsx
import { LicenseProvider, LicenseGate } from '@tour-kit/license'

function App() {
  return (
    <LicenseProvider
      organizationId="your-polar-org-id"
      licenseKey={process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY ?? ''}
    >
      <LicenseGate require="pro" fallback={<UpgradePrompt />}>
        <ProFeature />
      </LicenseGate>
    </LicenseProvider>
  )
}
```

For most apps you wrap once at the root and the Pro packages handle gating internally — most consumers never need `<LicenseGate>` directly.

## Components

### `<LicenseProvider>`

Wraps your app (or the Pro section). Performs validation on mount, caches results, re-validates on `refresh()`.

| Prop | Type | Required | Description |
|---|---|---|---|
| `organizationId` | `string` | Yes | Your Polar organization ID |
| `licenseKey` | `string` | Yes | License key with `TOURKIT-` prefix |
| `onValidate` | `(state: LicenseState) => void` | No | Called after validation completes |
| `onError` | `(error: Error) => void` | No | Called on validation error |

### `<LicenseGate>` / `<ProGate>`

Conditionally renders children based on license status. `ProGate` is a semantic alias.

| Prop | Type | Required | Description |
|---|---|---|---|
| `require` | `'pro'` | Yes | Required license tier |
| `fallback` | `ReactNode` | No | Shown when license is invalid |
| `loading` | `ReactNode` | No | Shown during validation |

### `<LicenseWatermark>`

Renders a semi-transparent "UNLICENSED" overlay when the license is invalid. Inline-styled with high z-index and `pointer-events: none` — resists basic CSS overrides.

### `<LicenseWarning>`

Dismissible warning banner.

| Prop | Type | Description |
|---|---|---|
| `message` | `string` | Custom warning text |
| `pricingUrl` | `string` | URL to pricing page |
| `dismissible` | `boolean` | Allow user dismissal |
| `onDismiss` | `() => void` | Dismissal callback |
| `className` | `string` | Custom class |

## Hooks

| Hook | Returns |
|---|---|
| `useLicense()` | `LicenseContextValue` — `{ state, refresh }` (throws outside provider) |
| `useIsPro()` | `boolean` — `true` when status is `'valid'` and tier is `'pro'` |
| `useLicenseGate()` | `LicenseGateResult` — for custom gating logic |

```tsx
const { state, refresh } = useLicense()
// state.status:        'loading' | 'valid' | 'invalid' | 'expired' | 'revoked' | 'error'
// state.tier:          'free' | 'pro'
// state.activations:   number   (used activation slots)
// state.maxActivations: number  (5)
// state.domain:        string | null
// state.expiresAt:     string | null
```

## Headless API

For Node.js, server-side validation, or non-React frameworks, import from the `/headless` entry — it has zero React dependencies:

```ts
import {
  validateLicenseKey,
  validateKey,
  activateKey,
  deactivateKey,
  readCache,
  writeCache,
  clearCache,
  getCurrentDomain,
  isDevEnvironment,
  validateDomainAtRender,
} from '@tour-kit/license/headless'

const state = await validateLicenseKey('TOURKIT-...', 'your-org-id')
const activation = await activateKey('TOURKIT-...', 'your-org-id', 'example.com')
await deactivateKey('TOURKIT-...', 'your-org-id', 'activation-id')
```

## License states

| State | Meaning |
|---|---|
| `loading` | Validation in progress |
| `valid` | Key validated, domain activated, within expiry |
| `invalid` | Key not recognized |
| `expired` | Key past `expiresAt` |
| `revoked` | Key explicitly revoked in Polar |
| `error` | Network / API failure |

## Environment variables

| Framework | Variable | Access |
|---|---|---|
| Next.js | `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` | `process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` |
| Vite | `VITE_TOUR_KIT_LICENSE_KEY` | `import.meta.env.VITE_TOUR_KIT_LICENSE_KEY` |
| Create React App | `REACT_APP_TOUR_KIT_LICENSE_KEY` | `process.env.REACT_APP_TOUR_KIT_LICENSE_KEY` |
| Node.js / Server | `TOUR_KIT_LICENSE_KEY` | `process.env.TOUR_KIT_LICENSE_KEY` |

## Development mode

On `localhost`, `127.0.0.1`, and `*.local` domains, license validation is automatically bypassed. **No activation slot is consumed.** The provider returns `{ status: 'valid', tier: 'pro' }`.

`staging.example.com` and other non-local hostnames do **not** bypass — even in development.

## CI/CD

To install restricted `@tour-kit/*` packages in CI:

1. Add `NPM_TOKEN` to your CI secrets (GitHub Actions, Vercel, Netlify, etc.).
2. Ensure `.npmrc` at the repo root contains:
   ```
   //registry.npmjs.org/:_authToken=${NPM_TOKEN}
   ```
3. `pnpm install` authenticates automatically.

## Types

```ts
import type {
  LicenseTier,                 // 'free' | 'pro'
  LicenseState,
  LicenseError,
  LicenseActivation,
  LicenseCache,
  LicenseConfig,
  LicenseContextValue,
  LicenseProviderProps,
  LicenseGateProps,
  LicenseWarningProps,
  ProGateProps,
  LicenseGateResult,
  PolarValidateResponse,
  PolarActivateResponse,
} from '@tour-kit/license'
```

## Gotchas

- **Dev bypass is hostname-scoped** — only `localhost`, `127.0.0.1`, and `*.local`.
- **`organizationId` is technically optional** in `LicenseProviderProps` but **required** for Polar validation to work.
- **Cache keys are domain-scoped** — `tourkit:license:{domain}` — so multiple sites on the same browser don't collide.
- **`headless.ts` ≠ `index.ts`** — don't accidentally import React-using modules from the headless entry; it breaks tree-shaking.
- **Watermark enforcement lives in Pro packages** via `useLicenseCheck()`, not in this package.

## Related packages

- [`@tour-kit/adoption`](https://www.npmjs.com/package/@tour-kit/adoption), [`@tour-kit/ai`](https://www.npmjs.com/package/@tour-kit/ai), [`@tour-kit/analytics`](https://www.npmjs.com/package/@tour-kit/analytics), [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements), [`@tour-kit/checklists`](https://www.npmjs.com/package/@tour-kit/checklists), [`@tour-kit/media`](https://www.npmjs.com/package/@tour-kit/media), [`@tour-kit/scheduling`](https://www.npmjs.com/package/@tour-kit/scheduling), [`@tour-kit/surveys`](https://www.npmjs.com/package/@tour-kit/surveys) — all Pro packages depend on this

## Documentation

Full documentation: [https://usertourkit.com/docs/licensing](https://usertourkit.com/docs/licensing)

## License

See [LICENSE.md](./LICENSE.md) for license terms.
