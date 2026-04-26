---
title: "@tour-kit/react"
type: package
package: "@tour-kit/react"
version: 0.5.0
sources:
  - ../packages/react/CLAUDE.md
  - ../packages/react/package.json
  - ../packages/react/src/index.ts
updated: 2026-04-26
---

*React components, hooks, and router adapters for tours. Most complex package — re-exports the entire `@tour-kit/core` API so consumers import from here only.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/react` |
| Version | 0.5.0 |
| License | MIT (free tier) |
| Bundle budget | < 12 KB gzipped |
| Deps | `@tour-kit/core`, `@floating-ui/react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Optional peers | `tailwindcss`, `@mui/base`, `next`, `react-router`, `react-router-dom` |

Optional peers cover the supported routing frameworks and the dual UI library option (Radix UI default, Base UI optional).

## Public API

### Tour components (styled)

| Export | Module |
|---|---|
| `Tour`, `TourStep` | `components/tour/` |
| `TourCard`, `TourCardHeader`, `TourCardContent`, `TourCardFooter` | `components/card/` |
| `TourNavigation`, `TourProgress`, `TourClose`, `TourRoutePrompt` | `components/navigation/` |
| `TourOverlay` | `components/overlay/` |
| `TourPortal`, `TourArrow` | `components/primitives/` |
| `MultiTourKitProvider` | `components/provider/tourkit-provider` |

Every component file starts with `'use client'` for Next.js App Router compatibility.

### UI variants (CVA)

For styling customization, all components expose their `class-variance-authority` configs:

```ts
tourButtonVariants, tourCardVariants, tourCardHeaderVariants,
tourCardContentVariants, tourCardFooterVariants,
tourProgressVariants, tourProgressDotVariants, tourOverlayVariants
```

Plus the corresponding `*Variants` types.

### Hooks

```ts
useTours()      // multi-tour registry consumer
useTourRoute()  // current route info from active adapter
```

Types: `TourInfo`, `UseToursReturn`.

### Router adapters

Each framework has a **factory** (testable, dep-injected) and a **direct hook** (convenient, dynamic-`require`):

```ts
useNextAppRouter, useNextPagesRouter, useReactRouter
createNextAppRouterAdapter, createNextPagesRouterAdapter, createReactRouterAdapter
```

Direct hooks throw if the framework isn't installed (they use dynamic `require()` internally). Factories let tests inject their own router primitives.

### Slot & UI library

```ts
cn                                   // tailwind-merge wrapper
Slot, Slottable                      // Radix UI primitives re-exported
UnifiedSlot                          // Reconciles Radix + Base UI render-prop styles
RenderProp, UnifiedSlotProps         // types
UILibraryProvider, useUILibrary      // Base UI opt-in
UILibrary, UILibraryProviderProps    // types
```

See [concepts/unified-slot.md](../concepts/unified-slot.md).

### Re-exports from `@tour-kit/core`

The package re-exports nearly the full `@tour-kit/core` surface:

- **Context**: `TourContext`, `TourProvider`, `TourKitContext`, `TourKitProvider`
- **Hooks**: `useTour`, `useStep`, `useSpotlight`, `useElementPosition`, `useKeyboardNavigation`, `useFocusTrap`, `usePersistence`, `useRoutePersistence`, `useMediaQuery`, `usePrefersReducedMotion`, `useBranch`
- **Utilities**: `createTour`, `createStep`, `waitForElement`, `isElementVisible`, `getScrollParent`, `scrollIntoView`, `generateId`, `announce`, `prefersReducedMotion`, `getStepAnnouncement`, `createStorageAdapter`, `createPrefixedStorage`, `safeJSONParse`, `calculatePosition`
- **Default configs**: `defaultSpotlightConfig`, `defaultKeyboardConfig`, `defaultPersistenceConfig`, `defaultA11yConfig`, `defaultScrollConfig`
- **Types**: All config, step, tour, state, hint, router, hook-return, and branch types from core. Notable rename: `TourStep` → `TourStepConfig`, `Tour` → `TourConfig` (to avoid name collisions with the `Tour` and `TourStep` *components*).

## Architectural decisions

- **Single import surface.** Consumers import from `@tour-kit/react` only. Don't mix imports from `@tour-kit/core` and `@tour-kit/react` in the same file.
- **Two patterns per router.** Factory + direct hook. Factories are unit-testable; direct hooks are ergonomic.
- **Component split:**
  - `components/*/` — styled components (Tailwind + CVA)
  - `components/headless/` — logic-only with render props
  - `components/ui/` — variant configs (CVA)
- **MultiTourKitProvider.** Lets multiple tours register declaratively in a single provider; trigger by ID via `useTours()`.

## Gotchas

- **`'use client'`** must be present in every component file for Next.js App Router builds.
- **Ref merging in `UnifiedSlot`.** The slot merges refs from parent and child — losing refs causes silent failures.
- **`onRouteChange` fires immediately** with the current route on mount, not just on subsequent changes.

## Related

- [packages/core.md](core.md) — re-exported foundation
- [packages/hints.md](hints.md) — sibling UI package, similar Slot pattern
- [concepts/unified-slot.md](../concepts/unified-slot.md)
- [concepts/router-adapters.md](../concepts/router-adapters.md)
- [architecture/provider-architecture.md](../architecture/provider-architecture.md)
