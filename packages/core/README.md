# @tour-kit/core

Framework-agnostic core logic, types, and utilities for Tour Kit.

## Installation

```bash
npm install @tour-kit/core
# or
pnpm add @tour-kit/core
```

## Quick Start

```tsx
import {
  TourKitProvider,
  TourProvider,
  useTour,
  createTour,
  createStep,
} from '@tour-kit/core'

// Define a tour
const welcomeTour = createTour({
  id: 'welcome',
  steps: [
    createStep({
      id: 'step-1',
      target: '#welcome-button',
      content: { title: 'Welcome!', description: 'Click here to get started.' },
      placement: 'bottom',
    }),
    createStep({
      id: 'step-2',
      target: '#dashboard',
      content: { title: 'Dashboard', description: 'View your data here.' },
      placement: 'right',
    }),
  ],
})

// Wrap your app
function App() {
  return (
    <TourKitProvider>
      <TourProvider tours={[welcomeTour]}>
        <YourApp />
      </TourProvider>
    </TourKitProvider>
  )
}

// Use in components
function WelcomeButton() {
  const { start } = useTour()
  return <button onClick={() => start('welcome')}>Start Tour</button>
}
```

## API Reference

### Providers

- **TourKitProvider** - Global configuration (analytics, storage, accessibility)
- **TourProvider** - Tour state management and step navigation

### Hooks

| Hook | Description |
|------|-------------|
| `useTour(tourId?)` | Main tour control (start, next, prev, skip, complete) |
| `useStep(stepId)` | Individual step management |
| `useElementPosition(target)` | Track element position with ResizeObserver |
| `useKeyboardNavigation(config?)` | Arrow keys, Enter, Escape handling |
| `useFocusTrap(enabled?)` | Trap focus within tour elements |
| `useSpotlight()` | Spotlight/overlay positioning |
| `usePersistence(config?)` | Tour state persistence |
| `useMediaQuery(query)` | Media query reactivity |
| `usePrefersReducedMotion()` | Detect motion preference |

### Utilities

| Utility | Description |
|---------|-------------|
| `createTour(config)` | Type-safe tour factory |
| `createStep(config)` | Type-safe step factory |
| `calculatePosition()` | Position calculation engine |
| `scrollIntoView()` | Smooth scroll to element |
| `announce()` | Screen reader announcements |
| `createStorageAdapter()` | Storage adapter factory |

### Types

```typescript
import type {
  Tour,
  TourStep,
  TourState,
  Placement,
  KeyboardConfig,
  SpotlightConfig,
  PersistenceConfig,
  RouterAdapter,
} from '@tour-kit/core'
```

## Configuration

### Keyboard Navigation

```tsx
const keyboardConfig = {
  enabled: true,
  nextKeys: ['ArrowRight', 'Enter'],
  prevKeys: ['ArrowLeft'],
  exitKeys: ['Escape'],
}
```

### Persistence

```tsx
const persistenceConfig = {
  enabled: true,
  storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'cookie'
  prefix: 'tourkit',
}
```

### Spotlight

```tsx
const spotlightConfig = {
  enabled: true,
  padding: 8,
  borderRadius: 4,
  color: 'rgba(0, 0, 0, 0.5)',
}
```

## Multi-Page Tours

For tours that span multiple pages, use a router adapter:

```tsx
import { TourProvider } from '@tour-kit/core'

function App() {
  return (
    <TourProvider
      tours={[multiPageTour]}
      router={yourRouterAdapter}
    >
      <YourApp />
    </TourProvider>
  )
}
```

See `@tour-kit/react` for pre-built router adapters.

## Documentation

Full documentation: [https://tour-kit.dev/docs/core](https://tour-kit.dev/docs/core)

## License

MIT
