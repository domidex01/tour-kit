---
title: Positioning engine
type: concept
sources:
  - ../packages/core/src/utils/position.ts
  - ../packages/core/src/hooks/use-element-position.ts
  - ../packages/core/src/hooks/use-spotlight.ts
  - ../packages/react/src/components/headless/tour-card.tsx
updated: 2026-04-26
---

*`@tour-kit/core` ships its own positioning math (`utils/position.ts`). UI packages additionally use `@floating-ui/react` for tooltip-grade positioning inside their card components.*

## Two layers

| Layer | Where | Purpose |
|---|---|---|
| Core math | `@tour-kit/core` `utils/position.ts` | Lightweight placement calc, RTL mirroring, collision fallbacks |
| Float positioning | `@floating-ui/react` (in `react`, `hints`, `announcements`, `checklists`, `surveys`) | Floating UI primitives for tooltip/popover positioning at runtime |

Core has zero runtime deps — UI packages opt into floating-ui only when they need it.

## Core utilities

```ts
parsePlacement(placement)              → { side, alignment }
calculatePosition(target, options)     → PositionResult
wouldOverflow(rect, viewport)          → boolean
getOppositeSide(side)                  → Side
getFallbackPlacements(preferred)       → Placement[]
calculatePositionWithCollision(...)    → PositionResult  // tries fallbacks
getDocumentDirection()                 → 'ltr' | 'rtl'
mirrorSide / mirrorAlignment / mirrorPlacementForRTL
```

Types: `PositionResult`, `Side`, `Alignment`, `Placement`, `Position`, `Rect`.

## Placement model

```
Side       = 'top' | 'right' | 'bottom' | 'left'
Alignment  = 'start' | 'center' | 'end'
Placement  = `${Side}` | `${Side}-${Alignment}`   // e.g. 'top-start'
```

12 placements total. Collision fallbacks try the opposite side first, then perpendicular sides.

## Reactive hook

```ts
useElementPosition(target, options) → ElementPositionResult
```

- Subscribes to scroll, resize, and target mutations
- Throttled via `throttleRAF` (from `core/utils/throttle.ts`)
- SSR-safe: no-ops when `window` is undefined
- Falls back gracefully if target element disappears or hasn't mounted yet

## Spotlight

```ts
useSpotlight(target, options) → UseSpotlightReturn
```

Returns rect + clip-path data for highlighting the target element. Used by `<TourOverlay>` and `<AnnouncementSpotlight>`.

## Floating UI usage

`@tour-kit/react`'s `tour-card.tsx` uses `@floating-ui/react`:

```ts
import { useFloating, autoUpdate, ... } from '@floating-ui/react'
```

Components needing tooltip-grade collision handling, arrow positioning, and middleware (offset, shift, flip) defer to floating-ui rather than re-implementing it.

## Why duplicate the math in core?

- Core has zero runtime deps (8KB budget)
- Headless consumers can do their own positioning without pulling in floating-ui
- RTL mirroring is needed in core regardless — once you have that, basic placement calc is small

## Related

- [packages/core.md](../packages/core.md)
- [packages/react.md](../packages/react.md)
- [packages/hints.md](../packages/hints.md)
