# @tour-kit/analytics

Analytics plugin system for Tour Kit.

## Installation

```bash
npm install @tour-kit/analytics @tour-kit/core
# or
pnpm add @tour-kit/analytics @tour-kit/core
```

## Quick Start

```tsx
import { AnalyticsProvider, createAnalyticsPlugin } from '@tour-kit/analytics'
import { TourKitProvider } from '@tour-kit/core'

// Create a plugin for your analytics service
const mixpanelPlugin = createAnalyticsPlugin({
  name: 'mixpanel',
  track: (event, properties) => {
    mixpanel.track(event, properties)
  },
})

// Or use a pre-built plugin
import { createSegmentPlugin } from '@tour-kit/analytics/plugins'

const segmentPlugin = createSegmentPlugin({
  writeKey: 'your-write-key',
})

// Wrap your app
function App() {
  return (
    <AnalyticsProvider plugins={[mixpanelPlugin, segmentPlugin]}>
      <TourKitProvider>
        <YourApp />
      </TourKitProvider>
    </AnalyticsProvider>
  )
}
```

## API Reference

### Provider

```tsx
<AnalyticsProvider
  plugins={[plugin1, plugin2]}
  enabled={true}
  debug={process.env.NODE_ENV === 'development'}
>
```

### Creating Plugins

```tsx
import { createAnalyticsPlugin } from '@tour-kit/analytics'

const myPlugin = createAnalyticsPlugin({
  name: 'my-analytics',

  // Required: Track events
  track: (event, properties) => {
    myService.track(event, properties)
  },

  // Optional: Identify users
  identify: (userId, traits) => {
    myService.identify(userId, traits)
  },

  // Optional: Page views
  page: (name, properties) => {
    myService.page(name, properties)
  },
})
```

### Hooks

| Hook | Description |
|------|-------------|
| `useAnalytics()` | Get analytics instance |
| `useTrack()` | Track events manually |

## Tracked Events

Tour Kit automatically tracks these events:

| Event | Description |
|-------|-------------|
| `tour_started` | Tour began |
| `tour_completed` | Tour finished all steps |
| `tour_skipped` | Tour was skipped |
| `tour_step_viewed` | Step was displayed |
| `tour_step_completed` | Step was completed |
| `hint_shown` | Hint was displayed |
| `hint_dismissed` | Hint was dismissed |
| `feature_adopted` | Feature reached adopted status |

## Event Properties

All events include:

```typescript
{
  tourId: string
  stepId?: string
  stepIndex?: number
  totalSteps?: number
  timestamp: string
  sessionId: string
}
```

## Multiple Plugins

Events are sent to all registered plugins:

```tsx
<AnalyticsProvider
  plugins={[
    segmentPlugin,
    amplitudePlugin,
    consolePlugin, // For debugging
  ]}
>
```

## Disabling Analytics

```tsx
// Globally
<AnalyticsProvider enabled={false}>

// Per event
const { track } = useAnalytics()
track('custom_event', { ... }, { skipPlugins: ['segment'] })
```

## Documentation

Full documentation: [https://tour-kit.dev/docs/analytics](https://tour-kit.dev/docs/analytics)

## License

MIT
