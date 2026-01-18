# @tour-kit/adoption

Feature adoption tracking and nudging system for Tour Kit.

## Installation

```bash
npm install @tour-kit/adoption @tour-kit/core
# or
pnpm add @tour-kit/adoption @tour-kit/core
```

## Quick Start

```tsx
import { AdoptionProvider, useFeature, IfNotAdopted, NewFeatureBadge } from '@tour-kit/adoption'

// Define features to track
const features = [
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    trigger: '#dark-mode-toggle', // CSS selector for click tracking
    adoptionCriteria: { minUses: 3, recencyDays: 30 },
  },
  {
    id: 'export',
    name: 'Export Data',
    trigger: { event: 'export:complete' }, // Custom event tracking
  },
]

// Wrap your app
function App() {
  return (
    <AdoptionProvider features={features}>
      <YourApp />
    </AdoptionProvider>
  )
}

// Show nudges for unadopted features
function DarkModeToggle() {
  return (
    <IfNotAdopted featureId="dark-mode">
      <NewFeatureBadge>Try dark mode!</NewFeatureBadge>
    </IfNotAdopted>
  )
}

// Track usage programmatically
function ExportButton() {
  const { trackUsage, isAdopted } = useFeature('export')

  const handleExport = () => {
    // ... export logic
    trackUsage()
  }

  return (
    <button onClick={handleExport}>
      Export {!isAdopted && <span>(New!)</span>}
    </button>
  )
}
```

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `AdoptionProvider` | Context provider for adoption tracking |
| `IfNotAdopted` | Conditional render if feature not adopted |
| `NewFeatureBadge` | Badge component for new features |
| `AdoptionNudge` | Nudge tooltip component |
| `FeatureButton` | Button with adoption tracking built-in |

### Dashboard Components

| Component | Description |
|-----------|-------------|
| `AdoptionDashboard` | Full admin dashboard |
| `AdoptionTable` | Feature adoption table |
| `AdoptionCategoryChart` | Chart by feature category |
| `AdoptionStatCard` | Individual stat card |

### Hooks

| Hook | Description |
|------|-------------|
| `useFeature(featureId)` | Get feature state and actions |
| `useAdoptionStats()` | Aggregate adoption statistics |
| `useNudge()` | Nudge scheduling control |

## Adoption Status

Features progress through these states:

| Status | Description |
|--------|-------------|
| `not_started` | Never used |
| `exploring` | Used but below minUses threshold |
| `adopted` | Meets adoption criteria |
| `churned` | Was adopted but hasn't been used recently |

## Configuration

```tsx
<AdoptionProvider
  features={features}
  storage={{ type: 'localStorage', key: 'my-app-adoption' }}
  nudge={{
    enabled: true,
    cooldown: 86400000, // 24 hours
    maxPerSession: 3,
    maxFeatures: 1,
  }}
  onAdoption={(feature) => analytics.track('feature_adopted', feature)}
  onChurn={(feature) => analytics.track('feature_churned', feature)}
>
```

## Documentation

Full documentation: [https://tour-kit.dev/docs/adoption](https://tour-kit.dev/docs/adoption)

## License

MIT
