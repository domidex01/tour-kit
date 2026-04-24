# @tour-kit/analytics

Plugin-based analytics integration.

## Plugin Interface

```ts
interface AnalyticsPlugin {
  name: string
  track?(event: TourEvent): void
  identify?(userId: string, traits?: Record<string, unknown>): void
  page?(name: string, properties?: Record<string, unknown>): void
}
```

## Available Plugins

- `ConsolePlugin` - Debug logging
- `PostHogPlugin` - PostHog integration
- `MixpanelPlugin` - Mixpanel integration
- `AmplitudePlugin` - Amplitude integration
- `GoogleAnalyticsPlugin` - GA4 integration

## Creating Custom Plugins

```ts
const myPlugin: AnalyticsPlugin = {
  name: 'my-plugin',
  track: (event) => myService.send(event),
}
```

## Gotchas

- **Plugin order**: Events dispatch to all plugins in registration order
- **SDK loading**: Plugins expect SDKs to be already loaded globally
- **Optional methods**: Plugins can implement only the methods they need

## Commands

```bash
pnpm --filter @tour-kit/analytics build
pnpm --filter @tour-kit/analytics typecheck
pnpm --filter @tour-kit/analytics test
```

## Related Rules
- `tour-kit/rules/architecture.md` - Package structure
