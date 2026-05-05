# @tour-kit/react

> React onboarding & product tour components — accessible, headless, Tailwind & shadcn-ready, with Next.js, React Router, TanStack Router adapters.

[![npm version](https://img.shields.io/npm/v/@tour-kit/react.svg)](https://www.npmjs.com/package/@tour-kit/react)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/react.svg)](https://www.npmjs.com/package/@tour-kit/react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/react?label=gzip)](https://bundlephobia.com/package/@tour-kit/react)
[![types](https://img.shields.io/npm/types/@tour-kit/react.svg)](https://www.npmjs.com/package/@tour-kit/react)
[![license](https://img.shields.io/npm/l/@tour-kit/react.svg)](https://github.com/domidex01/tour-kit/blob/main/LICENSE)

The components layer for **React onboarding**, **product tours**, **guided walkthroughs**, and **onboarding wizards**. Ships accessible defaults plus headless render-prop variants — works with **Tailwind**, **shadcn/ui**, **Radix UI**, or **Base UI**, and includes router adapters for **Next.js** (App + Pages), **React Router**, and **TanStack Router**.

**Alternative to:** [React Joyride](https://github.com/gilbarbara/react-joyride), [Reactour](https://github.com/elrumordelaluz/reactour), [Intro.js React](https://github.com/HiDeoo/intro.js-react), [Shepherd.js](https://shepherdjs.dev/), [Userpilot](https://userpilot.com/), [Appcues](https://www.appcues.com/), [Pendo](https://www.pendo.io/).

## Features

- **React onboarding components** — `Tour`, `TourStep`, `TourCard`, `TourNavigation`, `TourProgress`, `TourOverlay`
- **Headless variants** with render props — `TourCardHeadless`, `TourNavigationHeadless`, etc. for full UI control
- **Accessible by default** — focus trap, ARIA live regions, keyboard navigation, `prefers-reduced-motion`, RTL
- **Next.js App Router-ready** — every component starts with `'use client'`
- **Router adapters** — Next.js (App + Pages), React Router v6/v7, TanStack Router
- **Multi-tour registry** — `MultiTourKitProvider` registers many tours, trigger by id with `useTours()`
- **Lazy entry** — `@tour-kit/react/lazy` exports `React.lazy()` wrappers for code-splitting
- **Tailwind plugin** — `@tour-kit/react/tailwind` ships a CVA-aware preset
- **TypeScript-first** — strict types, full inference, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/react
# or
pnpm add @tour-kit/react
# or
yarn add @tour-kit/react
```

## Quick Start

```tsx
import { Tour, TourStep, TourKitProvider } from '@tour-kit/react'

function App() {
  return (
    <TourKitProvider>
      <Tour id="welcome-tour" autoStart>
        <TourStep
          id="step-1"
          target="#feature-button"
          title="Welcome!"
          content="Let me show you around."
        />
        <TourStep
          id="step-2"
          target="#another-element"
          title="This is great"
          content="Here's another feature."
        />
      </Tour>
    </TourKitProvider>
  )
}
```

## i18n & interpolation

All user-facing strings in `@tour-kit/react` accept the `{{var | fallback}}` interpolation grammar from `@tour-kit/core`. Wrap your tree in `<LocaleProvider>` and every step title, content, and button label resolves automatically.

```tsx
import { LocaleProvider } from '@tour-kit/core'
import { Tour, TourStep, TourKitProvider } from '@tour-kit/react'

<LocaleProvider locale="en" messages={{ welcome: 'Hi {{user.name | there}}' }}>
  <TourKitProvider>
    <Tour id="welcome-tour">
      <TourStep id="s1" target="#cta" title={{ key: 'welcome' }} />
    </Tour>
  </TourKitProvider>
</LocaleProvider>
```

> Full guide: https://usertourkit.com/docs/guides/i18n

## Why @tour-kit/react?

| | @tour-kit/react | React Joyride | Reactour | Intro.js React | Shepherd.js |
|---|---|---|---|---|---|
| Headless variants | ✅ | ❌ | ❌ | ❌ | Partial |
| TypeScript-native | ✅ | ✅ | ✅ | Partial | ✅ |
| Next.js App Router | ✅ (`'use client'`) | Manual | Manual | Manual | Manual |
| Multi-page tours | ✅ (built-in adapters) | Manual | Manual | ❌ | Manual |
| Branching & skip logic | ✅ | Limited | Limited | ❌ | Limited |
| `prefers-reduced-motion` | ✅ | ❌ | ❌ | ❌ | ❌ |
| RTL support | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tailwind preset | ✅ | ❌ | ❌ | ❌ | ❌ |
| License | MIT | MIT | MIT | MIT | MIT |

## Tailwind CSS setup

```ts
// tailwind.config.ts
import { tourKitPlugin } from '@tour-kit/react/tailwind'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tour-kit/react/dist/**/*.js',
  ],
  plugins: [tourKitPlugin],
}
```

`@tour-kit/react/tailwind` also exports `tourKitPreset` for Tailwind v4.

## Headless components

For full UI control, use the headless render-prop variants from the `/headless` entry:

```tsx
import { TourCardHeadless } from '@tour-kit/react/headless'

<TourCardHeadless
  render={({ currentStep, next, prev, floatingStyles }) => (
    <div style={floatingStyles}>
      <h2>{currentStep?.title}</h2>
      <button onClick={prev}>Back</button>
      <button onClick={next}>Next</button>
    </div>
  )}
/>
```

Available headless components:

- `TourCardHeadless`
- `TourNavigationHeadless`
- `TourProgressHeadless`
- `TourOverlayHeadless`
- `TourCloseHeadless`

## Router adapters

Each framework has a **factory** (testable, dependency-injected) and a **direct hook** (convenient):

```tsx
import { useNextAppRouter, TourProvider } from '@tour-kit/react'

function App() {
  const router = useNextAppRouter()
  return (
    <TourProvider tours={[multiPageTour]} router={router}>
      <YourApp />
    </TourProvider>
  )
}
```

| Framework | Hook | Factory |
|---|---|---|
| Next.js App Router | `useNextAppRouter()` | `createNextAppRouterAdapter(usePathname, useRouter)` |
| Next.js Pages Router | `useNextPagesRouter()` | `createNextPagesRouterAdapter(useRouter)` |
| React Router v6 / v7 | `useReactRouter()` | `createReactRouterAdapter(useLocation, useNavigate)` |

> Direct hooks call dynamic `require()` for the framework — they throw if the framework isn't installed. Factories accept your own router primitives so tests don't need the framework as a dependency.

## Lazy / code-split entry

```tsx
import { Suspense } from 'react'
import { LazyTour, LazyTourStep } from '@tour-kit/react/lazy'

<Suspense fallback={null}>
  <LazyTour id="welcome-tour">
    <LazyTourStep id="step-1" target="#cta" content="Click here" />
  </LazyTour>
</Suspense>
```

## API Reference

### Tour components

| Export | Purpose |
|---|---|
| `Tour` | Tour wrapper that registers steps declaratively |
| `TourStep` | Single step (target, title, content, placement) |
| `TourCard`, `TourCardHeader`, `TourCardContent`, `TourCardFooter` | Composable step card |
| `TourNavigation`, `TourProgress`, `TourClose` | Footer controls |
| `TourOverlay` | Spotlight overlay |
| `TourPortal`, `TourArrow` | Low-level primitives |
| `TourRoutePrompt` | Multi-page route confirmation prompt |
| `MultiTourKitProvider` | Registers many tours; trigger by id with `useTours()` |

### Variants (CVA)

For styling customization, every component exposes its `class-variance-authority` config:

```ts
import {
  tourButtonVariants,
  tourCardVariants,
  tourCardHeaderVariants,
  tourCardContentVariants,
  tourCardFooterVariants,
  tourProgressVariants,
  tourProgressDotVariants,
  tourOverlayVariants,
} from '@tour-kit/react'
```

### Hooks (own)

| Hook | Description |
|---|---|
| `useTours()` | Multi-tour registry consumer |
| `useTourRoute()` | Current route info from the active adapter |

### Hooks (re-exported from `@tour-kit/core`)

`useTour`, `useStep`, `useSpotlight`, `useElementPosition`, `useKeyboardNavigation`, `useFocusTrap`, `usePersistence`, `useRoutePersistence`, `useMediaQuery`, `usePrefersReducedMotion`, `useBranch`, `useUILibrary`.

### Utilities (re-exported)

`createTour`, `createStep`, `waitForElement`, `isElementVisible`, `getScrollParent`, `scrollIntoView`, `generateId`, `announce`, `prefersReducedMotion`, `getStepAnnouncement`, `createStorageAdapter`, `createPrefixedStorage`, `safeJSONParse`, `calculatePosition`, `cn`.

### Slot & UI library

```ts
import {
  Slot, Slottable,            // Radix UI primitives
  UnifiedSlot,                // Reconciles Radix + Base UI render-prop styles
  UILibraryProvider,          // Switch to Base UI
  useUILibrary,
} from '@tour-kit/react'
```

### Types

Re-exported from core. **Note the rename:** `TourStep` and `Tour` *components* shadow the type names from core, so types come through as `TourStepConfig` and `TourConfig`.

```ts
import type {
  TourConfig, TourStepConfig, TourState, TourCallbackContext,
  Placement, KeyboardConfig, SpotlightConfig, PersistenceConfig,
  RouterAdapter, MultiPagePersistenceConfig,
  Branch, BranchTarget, UseBranchReturn,
  UseTourReturn, UseStepReturn, UseSpotlightReturn,
  UseFocusTrapReturn, UsePersistenceReturn, UseRoutePersistenceReturn,
} from '@tour-kit/react'
```

## Single import surface

Always import from `@tour-kit/react`. Do **not** mix `@tour-kit/core` and `@tour-kit/react` imports in the same file — react re-exports nearly the full core surface to keep your imports flat.

## Related packages

- [`@tour-kit/core`](https://www.npmjs.com/package/@tour-kit/core) — headless engine (re-exported here)
- [`@tour-kit/hints`](https://www.npmjs.com/package/@tour-kit/hints) — persistent hints, hotspots, beacons
- [`@tour-kit/checklists`](https://www.npmjs.com/package/@tour-kit/checklists) — onboarding checklists
- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — modal / toast / banner / slideout announcements
- [`@tour-kit/analytics`](https://www.npmjs.com/package/@tour-kit/analytics) — PostHog, Mixpanel, Amplitude, GA4 plugins

## Documentation

Full documentation: [https://usertourkit.com/docs/react](https://usertourkit.com/docs/react)

See [Troubleshooting](https://usertourkit.com/docs/troubleshooting) for React 19 / Next 16 caveats.

## License

MIT © Tour Kit Team
