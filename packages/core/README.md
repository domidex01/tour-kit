# @tour-kit/core

> Headless React onboarding & product tour engine — framework-agnostic logic for guided tours, walkthroughs, and step-by-step flows.

[![npm version](https://img.shields.io/npm/v/@tour-kit/core.svg)](https://www.npmjs.com/package/@tour-kit/core)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/core.svg)](https://www.npmjs.com/package/@tour-kit/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/core?label=gzip)](https://bundlephobia.com/package/@tour-kit/core)
[![types](https://img.shields.io/npm/types/@tour-kit/core.svg)](https://www.npmjs.com/package/@tour-kit/core)
[![license](https://img.shields.io/npm/l/@tour-kit/core.svg)](https://github.com/domidex01/tour-kit/blob/main/LICENSE)

The headless engine that powers **React onboarding** flows, **product tours**, **guided walkthroughs**, and step-by-step **onboarding wizards**. Ship the logic without prebuilt UI — bring your own components, or use [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) for accessible defaults.

**Alternative to:** [Shepherd.js](https://shepherdjs.dev/), [Driver.js](https://driverjs.com/), [Intro.js](https://introjs.com/), [Reactour](https://github.com/elrumordelaluz/reactour), [React Joyride](https://github.com/gilbarbara/react-joyride) — pick `@tour-kit/core` when you want positioning, focus management, and state without opinionated UI.

## Features

- **React onboarding** primitives — `TourProvider`, `useTour`, `useStep`
- **Product tour** state machine with branching, skip logic, multi-page navigation
- **Headless** — no styles shipped; bring your own UI or use `@tour-kit/react`
- **Accessible by default** — focus trap, screen-reader announcements, `prefers-reduced-motion`, RTL support
- **SSR-safe** — Next.js App Router, Remix, Astro all work
- **Tree-shakeable** — `sideEffects: false`, ESM + CJS dual build
- **Zero runtime dependencies** beyond `clsx` and `tailwind-merge`
- **TypeScript-first** — strict types, full inference, peer-dep React 18 & 19

## Installation

```bash
npm install @tour-kit/core
# or
pnpm add @tour-kit/core
# or
yarn add @tour-kit/core
```

## Quick Start

```tsx
import {
  TourKitProvider,
  TourProvider,
  useTour,
  createNamedTour,
  createNamedStep,
} from '@tour-kit/core'

// 1. Define a tour (steps + tour both get explicit IDs)
const welcomeTour = createNamedTour('welcome', [
  createNamedStep('step-1', '#welcome-button', 'Click here to get started.', {
    title: 'Welcome!',
    placement: 'bottom',
  }),
  createNamedStep('step-2', '#dashboard', 'View your data here.', {
    title: 'Dashboard',
    placement: 'right',
  }),
])

// 2. Wrap your app
function App() {
  return (
    <TourKitProvider>
      <TourProvider tours={[welcomeTour]}>
        <YourApp />
      </TourProvider>
    </TourKitProvider>
  )
}

// 3. Trigger from any component
function WelcomeButton() {
  const { start } = useTour()
  return <button onClick={() => start('welcome')}>Start Tour</button>
}
```

> Use `createTour(steps, options?)` and `createStep(target, content, options?)` if you want auto-generated IDs.

## Why @tour-kit/core?

| | @tour-kit/core | React Joyride | Intro.js | Shepherd.js | Driver.js |
|---|---|---|---|---|---|
| Headless / BYO UI | ✅ | ❌ | ❌ | Partial | ❌ |
| TypeScript-native | ✅ | ✅ | Community types | ✅ | ✅ |
| Multi-page / router-aware | ✅ | Manual | ❌ | Manual | ❌ |
| Branching & skip logic | ✅ | Limited | ❌ | Limited | ❌ |
| Bundle (gzip) | < 8 KB | ~24 KB | ~16 KB | ~10 KB | ~5 KB |
| `prefers-reduced-motion` | ✅ | ❌ | ❌ | ❌ | ❌ |
| RTL support | ✅ | ❌ | ❌ | ❌ | ❌ |
| License | MIT | MIT | GPL/Commercial | MIT | MIT |
| Framework | Any React | React | Vanilla + wrappers | Any | Vanilla |

## API Reference

### Providers

| Provider | Purpose |
|---|---|
| `TourKitProvider` | Global config (analytics, storage, accessibility, UI library) |
| `TourProvider` | Tour state, step navigation, registers one or more tours |
| `UILibraryProvider` | Switch between Radix UI and Base UI primitives |

### Hooks

| Hook | Description |
|---|---|
| `useTour(tourId?)` | Tour control — `start`, `next`, `prev`, `skip`, `complete`, `goToStep` |
| `useStep(stepId)` | Read/update a specific step's runtime state |
| `useBranch()` | Trigger named actions and branch navigation from step content |
| `useAdvanceOn(config)` | Auto-advance the tour on a DOM event (`click`, `input`, custom) |
| `useElementPosition(target)` | Track an element's position with `ResizeObserver` |
| `useSpotlight()` | Spotlight/overlay positioning data |
| `useFocusTrap(enabled?)` | Trap focus within tour cards for a11y |
| `useKeyboardNavigation(config?)` | Arrow keys, Enter, Escape handling |
| `usePersistence(config?)` | Save/restore tour state across reloads |
| `useRoutePersistence()` | Multi-page tour route resume support |
| `useMediaQuery(query)` | Reactive media query matcher |
| `usePrefersReducedMotion()` | Respect `prefers-reduced-motion` |
| `useTourKitContext()` | Access global config from anywhere |
| `useDirection()` | Current text direction (`ltr`/`rtl`) |
| `useUILibrary()` | Current UI library mode (`radix`/`base-ui`) |

### Factories

| Function | Description |
|---|---|
| `createTour(steps, options?)` | Tour with auto-generated id |
| `createNamedTour(id, steps, options?)` | Tour with explicit id |
| `createStep(target, content, options?)` | Step with auto-generated id |
| `createNamedStep(id, target, content, options?)` | Step with explicit id |
| `createStorageAdapter(impl)` | Custom storage backend factory |
| `createPrefixedStorage(prefix, storage?)` | Namespace keys to avoid collisions |
| `createCookieStorage(options?)` | Cookie-backed storage adapter |
| `createNoopStorage()` | No-op adapter (SSR / opt-out) |

### Utilities

| Function | Description |
|---|---|
| `calculatePosition()` | Position math (returns `{ x, y, placement }`) |
| `calculatePositionWithCollision()` | Position with collision-aware fallback placements |
| `getElement(target)` | Resolve a `target` (selector or ref) to a DOM node |
| `waitForElement(target, timeout?)` | Resolve when a target appears in the DOM |
| `isElementVisible(el)` | Visibility check including viewport |
| `scrollIntoView(el, options?)` | Smooth scroll to an element |
| `lockScroll(enabled)` | Lock/unlock body scroll |
| `announce(message)` | ARIA live-region announcement |
| `prefersReducedMotion()` | Read the user's motion preference |
| `dispatchAdvanceEvent(name)` | Trigger a custom advance event for `useAdvanceOn` |
| `cn(...inputs)` | `clsx` + `tailwind-merge` (tour-kit's class utility) |

### Types

```ts
import type {
  // Tour & step
  Tour,
  TourStep,
  TourOptions,
  StepOptions,
  TourState,
  TourActions,
  TourCallbackContext,
  TourContextValue,
  TourKitConfig,
  // Positioning
  Side,
  Alignment,
  Placement,
  Position,
  Rect,
  // Config
  KeyboardConfig,
  SpotlightConfig,
  PersistenceConfig,
  A11yConfig,
  ScrollConfig,
  Direction,
  Storage,
  // Routing & branching
  RouterAdapter,
  MultiPagePersistenceConfig,
  Branch,
  BranchTarget,
  BranchToTour,
  BranchSkip,
  BranchWait,
  BranchContext,
  BranchResolver,
  UseBranchReturn,
  // Hints (used by @tour-kit/hints)
  HintConfig,
  HintState,
  HintsState,
  HintsActions,
  HintsContextValue,
  HotspotPosition,
} from '@tour-kit/core'
```

## Configuration

### Keyboard navigation

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
  storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'cookie' | Storage
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

## Multi-page tours

For tours that span multiple routes, pass a router adapter to `TourProvider`:

```tsx
import { TourProvider } from '@tour-kit/core'

function App() {
  return (
    <TourProvider tours={[multiPageTour]} router={yourRouterAdapter}>
      <YourApp />
    </TourProvider>
  )
}
```

`@tour-kit/react` ships ready-made adapters for Next.js (App Router & Pages Router), React Router v6/v7, and TanStack Router.

## Related packages

- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — Accessible TourCard, TourPopover, headless variants, router adapters
- [`@tour-kit/hints`](https://www.npmjs.com/package/@tour-kit/hints) — Persistent feature hints, hotspots, beacons
- [`@tour-kit/checklists`](https://www.npmjs.com/package/@tour-kit/checklists) — Onboarding checklists with task dependencies
- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — In-app product announcements (modal / toast / banner / slideout / spotlight)

## Documentation

Full documentation: [https://usertourkit.com/docs/core](https://usertourkit.com/docs/core)

## License

MIT © Tour Kit Team
