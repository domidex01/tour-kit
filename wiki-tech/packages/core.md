---
title: "@tour-kit/core"
type: package
package: "@tour-kit/core"
version: 0.5.0
sources:
  - ../packages/core/CLAUDE.md
  - ../packages/core/package.json
  - ../packages/core/src/index.ts
  - ../packages/core/src/hooks
  - ../packages/core/src/utils
updated: 2026-04-26
---

*Framework-agnostic foundation. Owns types, context, hooks, and utilities. UI packages are thin wrappers around it.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/core` |
| Version | 0.5.0 |
| License | MIT (free tier) |
| Bundle budget | < 8 KB gzipped (project quality gate) |
| Runtime deps | none |
| Peer deps | `react ^18 \|\| ^19`, `react-dom ^18 \|\| ^19` |
| `sideEffects` | `false` (tree-shakeable) |

`dependencies: []` — core ships no third-party runtime code. Position math is implemented directly (`utils/position.ts`). `@floating-ui/react` is used by **UI packages**, not core.

## Source layout

```
src/
├── index.ts        # Public barrel re-exports from types/context/hooks/utils
├── types/          # All shared type definitions
├── context/        # TourKitContext, TourContext + providers
├── hooks/          # 12 hooks (see below)
└── utils/          # 11 util modules
```

## Public API

### Context & providers

```ts
TourKitContext, TourKitProvider, useTourKitContext, useDirection
TourContext, TourProvider, useTourContext, useTourContextOptional
```

Types: `TourKitContextValue`, `TourKitProviderProps`, `TourProviderProps`.

Convention: every context hook **throws** if used outside its provider — intentional, so failures are loud. `useTourContextOptional` is the soft variant for opt-in consumers.

### Hooks (`src/hooks/`)

| Hook | File | Purpose |
|---|---|---|
| `useTour` | `use-tour.ts` | Tour lifecycle: start/stop/next/prev |
| `useStep` | `use-step.ts` | Current step state and actions |
| `useSpotlight` | `use-spotlight.ts` | Spotlight rect + clip-path data |
| `useElementPosition` | `use-element-position.ts` | Reactive position of a target element |
| `useKeyboardNavigation` | `use-keyboard.ts` | Arrow/Esc/Enter handling |
| `useFocusTrap` | `use-focus-trap.ts` | A11y focus trap inside tour cards |
| `usePersistence` | `use-persistence.ts` | Save/restore tour state via storage adapter |
| `useRoutePersistence` | `use-route-persistence.ts` | Multi-page tour persistence |
| `useMediaQuery` | `use-media-query.ts` | SSR-safe media query subscription |
| `usePrefersReducedMotion` | `use-media-query.ts` | Shortcut for `(prefers-reduced-motion: reduce)` |
| `useAdvanceOn` | `use-advance-on.ts` | Auto-advance on event/predicate (pair with `dispatchAdvanceEvent`) |
| `useBranch` | `use-branch.ts` | Branching tours: jump to tour / skip / wait |

Return-type aliases also exported: `UseTourReturn`, `UseStepReturn`, `UseSpotlightReturn`, `ElementPositionResult`, `UseFocusTrapReturn`, `UsePersistenceReturn`, `UseRoutePersistenceReturn`, `UseAdvanceOnOptions`, `UseBranchReturn`.

### Utilities (`src/utils/`)

| Module | Notable exports |
|---|---|
| `dom.ts` | `getElement`, `isElementVisible`, `isElementPartiallyVisible`, `waitForElement`, `getFocusableElements`, `getScrollParent`, `getElementRect`, `getViewportDimensions` |
| `position.ts` | `parsePlacement`, `calculatePosition`, `wouldOverflow`, `getOppositeSide`, `getFallbackPlacements`, `calculatePositionWithCollision`, `getDocumentDirection`, `mirrorSide`, `mirrorAlignment`, `mirrorPlacementForRTL` |
| `scroll.ts` | `scrollIntoView`, `scrollTo`, `getScrollPosition`, `lockScroll` |
| `storage.ts` | `createStorageAdapter`, `createNoopStorage`, `createCookieStorage`, `safeJSONParse`, `createPrefixedStorage` |
| `a11y.ts` | `announce`, `getStepAnnouncement`, `prefersReducedMotion` |
| `create-tour.ts` | `createTour`, `createNamedTour` |
| `create-step.ts` | `createStep`, `createNamedStep` |
| `branch.ts` | `MAX_BRANCH_DEPTH`, `isBranchToTour`, `isBranchSkip`, `isBranchWait`, `isSpecialTarget`, `isBranchResolver`, `resolveBranch`, `resolveTargetToIndex`, `isLoopDetected` |
| `throttle.ts` | `throttleRAF`, `throttleTime`, `throttleLeading` |
| `logger.ts` | `logger`, types `LogLevel`, `LoggerConfig` |
| `index.ts` | `generateId` |

### Types

The `types/` barrel exports configuration, state, and branch types. Notable groups:

- **Placement / Position**: `Side`, `Alignment`, `Placement`, `Position`, `Rect`
- **Config**: `TourKitConfig`, `TourStep`, `StepOptions`, `Tour`, `TourOptions`, `KeyboardConfig`, `SpotlightConfig`, `Storage`, `PersistenceConfig`, `A11yConfig`, `ScrollConfig`, `Direction`
- **State**: `TourState`, `TourCallbackContext`, `TourActions`, `TourContextValue`
- **Hints**: `HotspotPosition`, `HintConfig`, `HintState`, `HintsState`, `HintsActions`, `HintsContextValue`
- **Routing**: `RouterAdapter`, `MultiPagePersistenceConfig`
- **Branching**: `BranchTarget`, `BranchToTour`, `BranchSkip`, `BranchWait`, `BranchContext`, `BranchResolver`, `Branch`, `UseBranchReturn`

Runtime defaults: `defaultKeyboardConfig`, `defaultSpotlightConfig`, `defaultPersistenceConfig`, `defaultA11yConfig`, `defaultScrollConfig`, `initialTourState`.

## Architectural decisions

- **Barrel exports for tree-shaking.** Each subdir has its own barrel; `src/index.ts` re-exports them by category.
- **SSR safety.** Every DOM-touching hook checks `typeof window !== 'undefined'` before access.
- **Refs over state for position.** Position values flow through refs to avoid re-render cascades on scroll/resize.
- **Reduced motion is opt-out, not opt-in.** Hooks query `prefers-reduced-motion` and degrade animations automatically.
- **Storage is pluggable.** `createStorageAdapter()` lets you swap localStorage for cookies, memory, or any custom backend.

## Consumer rule

UI packages (`@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/surveys`, …) **re-export from `core`** so application code only imports from one package. Don't import directly from `@tour-kit/core` in app code if you're already using a wrapper.

## Related

- [packages/react.md](react.md) — primary consumer, re-exports nearly all of core
- [packages/hints.md](hints.md) — independent surface, also depends on core
- [architecture/dependency-graph.md](../architecture/dependency-graph.md) — who depends on core
- [architecture/build-pipeline.md](../architecture/build-pipeline.md) — how core is bundled
- [concepts/positioning-engine.md](../concepts/positioning-engine.md) — `calculatePosition` deep dive
- [concepts/storage-adapters.md](../concepts/storage-adapters.md) — `createStorageAdapter` design
- [concepts/focus-trap.md](../concepts/focus-trap.md) — `useFocusTrap` semantics
