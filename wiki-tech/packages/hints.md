---
title: "@tour-kit/hints"
type: package
package: "@tour-kit/hints"
version: 0.5.0
sources:
  - ../packages/hints/CLAUDE.md
  - ../packages/hints/package.json
  - ../packages/hints/src/index.ts
updated: 2026-04-26
---

*Persistent hints and hotspots — UI affordances that exist outside any tour. Each hint has independent open/dismissed state, tracked in storage.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/hints` |
| Version | 0.5.0 |
| License | MIT (free tier) |
| Bundle budget | < 5 KB gzipped |
| Deps | `@tour-kit/core`, `@floating-ui/react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Optional peers | `tailwindcss`, `@mui/base` |

## Public API

### Components

```ts
Hint, HintHotspot, HintTooltip
```

Types: `HintProps`, `HintHotspotProps`, `HintTooltipProps`.

Composition shape:

```tsx
<HintsProvider hints={[...]}>
  <HintHotspot hintId="feature-x">
    <HintTooltip>
      <HintContent />
    </HintTooltip>
  </HintHotspot>
</HintsProvider>
```

### Context & provider

```ts
HintsProvider
HintsContext, useHintsContext
```

### Hooks

```ts
useHints()        // all hints + dismissAll
useHint(id)       // single hint state + actions
```

### UI variants (CVA)

```ts
hintHotspotVariants, hintTooltipVariants, hintCloseVariants
HintHotspotVariants, HintTooltipVariants, HintCloseVariants
```

### Slot & UI library

```ts
cn
Slot, Slottable, UnifiedSlot, UnifiedSlotProps
UILibraryProvider, useUILibrary, UILibrary, UILibraryProviderProps
```

### Types

```ts
HintConfig, HintState, HotspotPosition, HintsContextValue, Placement
```

(Re-exported from `@tour-kit/core` types where shared.)

## Lifecycle vs tours

| | Hints | Tours |
|---|---|---|
| Order | Independent | Sequential steps |
| Lifetime | Until dismissed | One run-through |
| State per item | Open / dismissed / hidden | Active step index |
| Use case | "Try the new sidebar" pulse | "Walk me through onboarding" |

Don't use hints for sequential onboarding — that's what tours are for.

## Dismissal patterns

- `dismiss()` — mark dismissed; won't show again (persists via storage adapter)
- `hide()` — close temporarily; reopens next session

## Gotchas

- **Z-index.** Hotspots and tooltips need a high z-index to escape parent containers.
- **Visibility check.** Call `isElementVisible()` (from `@tour-kit/core`) before showing a hotspot — attaching to a hidden element is a silent failure.

## Related

- [packages/core.md](core.md) — provides `HintConfig`, `HintState`, position math
- [packages/react.md](react.md) — sibling UI package (sequential tours)
- [concepts/positioning-engine.md](../concepts/positioning-engine.md)
- [concepts/storage-adapters.md](../concepts/storage-adapters.md)
