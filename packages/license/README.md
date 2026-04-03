# @tour-kit/license

License validation for Tour Kit Pro features using [Polar.sh](https://polar.sh) license key validation and domain activation.

## Installation

This is a restricted npm package. Set up `.npmrc` with your auth token first:

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

Then install:

```bash
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
      <LicenseGate require="pro">
        <ProFeature />
      </LicenseGate>
    </LicenseProvider>
  )
}
```

## Configuration

### `<LicenseProvider>`

Wrap your app (or the section using pro features) with `LicenseProvider`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `organizationId` | `string` | Yes | Your Polar organization ID |
| `licenseKey` | `string` | Yes | License key with `TOURKIT-` prefix |
| `onValidate` | `(state: LicenseState) => void` | No | Called after validation completes |
| `onError` | `(error: Error) => void` | No | Called on validation error |

```tsx
<LicenseProvider
  organizationId="your-polar-org-id"
  licenseKey={process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY ?? ''}
  onValidate={(state) => console.log('License:', state.status)}
  onError={(err) => console.error('License error:', err)}
>
  {children}
</LicenseProvider>
```

## Components

### `<LicenseGate>`

Conditionally renders children based on license status. Uses interleaved render-key validation.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `require` | `'pro'` | Yes | Required license tier |
| `fallback` | `ReactNode` | No | Shown when license is invalid |
| `loading` | `ReactNode` | No | Shown during validation |

```tsx
<LicenseGate require="pro" fallback={<UpgradePrompt />}>
  <AdvancedAnalytics />
</LicenseGate>
```

### `<LicenseWatermark>`

Renders a semi-transparent "UNLICENSED" overlay when the license is invalid. Uses inline styles with high z-index and `pointer-events: none`. Resists basic CSS overrides.

### `<LicenseWarning>`

Displays a dismissible warning banner when the license is invalid.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `message` | `string` | No | Custom warning message |
| `pricingUrl` | `string` | No | URL to pricing page |
| `dismissible` | `boolean` | No | Whether the warning can be dismissed |
| `onDismiss` | `() => void` | No | Called when dismissed |
| `className` | `string` | No | Custom CSS class |

## Hooks

### `useLicense()`

Returns the current license context. Must be used within `<LicenseProvider>`.

```tsx
const { state, refresh } = useLicense()
// state.status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'loading' | 'error'
// state.tier: 'free' | 'pro'
// state.activations: number
// state.maxActivations: number
// state.domain: string | null
// state.expiresAt: string | null
// refresh(): re-validates the license (clears cache first)
```

### `useIsPro()`

Returns `true` when the license tier is `'pro'` and status is `'valid'`, `false` otherwise.

```tsx
const isPro = useIsPro()
```

## Headless API

For non-React usage (Node.js, server-side, other frameworks), import from the headless entry point:

```ts
import {
  validateLicenseKey,
  activateKey,
  deactivateKey,
  readCache,
  writeCache,
  clearCache,
  getCurrentDomain,
  isDevEnvironment,
} from '@tour-kit/license/headless'

// Validate a license key
const state = await validateLicenseKey('TOURKIT-...', 'your-org-id')

// Activate on a domain
const activation = await activateKey('TOURKIT-...', 'your-org-id', 'example.com')

// Deactivate
await deactivateKey('TOURKIT-...', 'your-org-id', 'activation-id')
```

## Environment Variables

Set the license key as an environment variable appropriate for your framework:

| Framework | Variable | Access |
|-----------|----------|--------|
| Next.js | `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` | `process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` |
| Vite | `VITE_TOUR_KIT_LICENSE_KEY` | `import.meta.env.VITE_TOUR_KIT_LICENSE_KEY` |
| Create React App | `REACT_APP_TOUR_KIT_LICENSE_KEY` | `process.env.REACT_APP_TOUR_KIT_LICENSE_KEY` |
| Node.js / Server | `TOUR_KIT_LICENSE_KEY` | `process.env.TOUR_KIT_LICENSE_KEY` |

## Development Mode

On `localhost`, `127.0.0.1`, and `*.local` domains, license validation is automatically bypassed. No activation slot is consumed. The provider returns `{ status: 'valid', tier: 'pro' }`.

## CI/CD

For installing restricted `@tour-kit/*` packages in CI:

1. Add `NPM_TOKEN` to your CI secrets (GitHub Actions, Vercel, Netlify, etc.)
2. Ensure `.npmrc` at the repo root contains:
   ```
   //registry.npmjs.org/:_authToken=${NPM_TOKEN}
   ```
3. `pnpm install` will authenticate automatically using the token from the environment.

## Documentation

Full documentation: [https://tourkit.dev/docs/licensing](https://tourkit.dev/docs/licensing)

## License

See [LICENSE.md](./LICENSE.md) for license terms.
