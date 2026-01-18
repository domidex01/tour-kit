# @tour-kit/license

License validation for Tour Kit commercial features.

## Installation

```bash
npm install @tour-kit/license
# or
pnpm add @tour-kit/license
```

## Quick Start

```tsx
import { LicenseProvider, useLicense } from '@tour-kit/license'

// Wrap your app with license validation
function App() {
  return (
    <LicenseProvider licenseKey={process.env.TOUR_KIT_LICENSE_KEY}>
      <YourApp />
    </LicenseProvider>
  )
}

// Check license status in components
function PremiumFeature() {
  const { isValid, tier } = useLicense()

  if (!isValid) {
    return <UpgradePrompt />
  }

  if (tier === 'enterprise') {
    return <EnterpriseFeature />
  }

  return <ProFeature />
}
```

## API Reference

### Provider

```tsx
<LicenseProvider
  licenseKey="your-license-key"
  onValidationError={(error) => console.error(error)}
>
```

### Hooks

| Hook | Description |
|------|-------------|
| `useLicense()` | Get license status and tier |
| `useLicenseFeature(feature)` | Check if feature is enabled |

### License Tiers

| Tier | Description |
|------|-------------|
| `free` | Basic features, limited tours |
| `pro` | All features, unlimited tours |
| `enterprise` | All features + SSO, audit logs |

## Validation

Licenses are validated:

1. On app startup
2. Periodically (configurable interval)
3. When license key changes

```tsx
<LicenseProvider
  licenseKey={key}
  validationInterval={86400000} // 24 hours
  offlineGracePeriod={604800000} // 7 days
>
```

## Offline Support

Licensed features continue to work offline for a grace period after the last successful validation.

## Documentation

Full documentation: [https://tour-kit.dev/docs/license](https://tour-kit.dev/docs/license)

## License

MIT (the package itself is MIT; commercial licenses apply to certain features)
