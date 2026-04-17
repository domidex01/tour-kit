---
title: "Floating UI vs Popper.js: which positioning library should you use in 2026?"
published: false
description: "Popper.js hasn't shipped a release since 2022. Floating UI replaced it with a tree-shakeable middleware system at half the bundle size. Here's the full breakdown for tour and tooltip positioning."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning
cover_image: https://usertourkit.com/og-images/floating-ui-vs-popper-js-tour-positioning.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning)*

# Floating UI vs Popper.js for tour positioning: 2026 comparison

If you're building product tours, tooltips, or popovers in 2026, you've probably noticed the confusing naming situation. Popper.js, `@popperjs/core`, Floating UI, `@floating-ui/dom`, `@floating-ui/react`. They all solve the same core problem (positioning a floating element next to a reference element), but they're different libraries at different stages of their lifecycle. One is actively maintained. The other hasn't shipped a release since 2022.

We use Floating UI internally in Tour Kit's positioning engine, so we've spent real time with both libraries and their quirks. This article covers what actually changed between them, where Popper.js falls short today, and how to pick the right positioning library for your tour or tooltip system.

```bash
npm install @floating-ui/react
```

## What is the difference between Floating UI and Popper.js?

Floating UI is the successor to Popper.js, built by the same creator (Federico Zivolo). Popper.js v2 (`@popperjs/core`) reached end of active development in 2022, and Floating UI (`@floating-ui/dom`) took over as the recommended positioning library. As of April 2026, `@floating-ui/dom` has 30,380 GitHub stars and 6.25 million weekly npm downloads, while `@popperjs/core` still pulls around 8.7 million weekly downloads, largely from legacy projects that haven't migrated.

The fundamental difference is architectural. Popper.js uses a monolithic modifier system where all positioning logic ships as one bundle. Floating UI uses a tree-shakeable middleware pipeline where you import only the positioning behaviors you need: `flip`, `shift`, `offset`, `arrow`, `size`, `autoPlacement`. You pay for what you use.

## Why your positioning library choice matters for tour quality

Tooltip positioning is the single most visible piece of a product tour. When a tooltip clips behind a sidebar, disappears below the fold, or jumps between positions during a scroll, users notice immediately and lose trust in the tour. Google's [web.dev performance audit guidance](https://web.dev/articles/cls) flags layout shifts from repositioned elements as a Core Web Vital penalty. We measured a 15ms TBT difference between Popper.js and Floating UI in our [2026 benchmark](https://usertourkit.com/blog/react-tour-library-benchmark-2026), which compounds across multi-step tours.

## Why Popper.js is effectively deprecated

Popper.js v2 (`@popperjs/core`) still works. No one deleted it from npm. But it hasn't received a meaningful update since late 2022, and the official repository README directs developers to Floating UI.

Three concrete problems hit teams still running Popper.js in 2026:

**React 19 compatibility gaps.** Popper.js was designed for direct DOM manipulation. It conflicts with React 19's concurrent rendering in edge cases, particularly when tour steps animate between positions during a transition.

**No TypeScript-first design.** Popper.js added type definitions after the fact. Floating UI was written in TypeScript from the start. The middleware types compose cleanly, with generic parameters that carry through to your positioning result.

**Bundle size overhead.** `@popperjs/core` ships at roughly 7kB gzipped with no tree-shaking. `@floating-ui/dom` ships at roughly 3kB gzipped, and if you only import `computePosition` + `flip` + `offset`, you pay for even less.

## The middleware system vs modifiers: what changed

Popper.js modifiers are configuration objects with `name`, `enabled`, `phase`, and `fn` properties. Floating UI replaced them with middleware: pure functions that receive positioning state and return adjustments.

```tsx
// Popper.js v2
import { createPopper } from '@popperjs/core';

const popper = createPopper(referenceEl, tooltipEl, {
  modifiers: [
    { name: 'offset', options: { offset: [0, 8] } },
    { name: 'flip', options: { fallbackPlacements: ['top'] } },
    { name: 'preventOverflow', options: { boundary: 'viewport' } },
  ],
});
```

```tsx
// Floating UI
import { computePosition, offset, flip, shift } from '@floating-ui/dom';

const { x, y } = await computePosition(referenceEl, tooltipEl, {
  middleware: [offset(8), flip(), shift({ padding: 5 })],
});
```

The Floating UI version is async by default. It allows middleware to measure the DOM without blocking the main thread. Middleware compose left to right with no phase system to reason about.

## How tour libraries use positioning under the hood

| Tour library | Positioning engine | Bundle impact |
|---|---|---|
| Tour Kit | @floating-ui/dom | ~3kB (tree-shaken) |
| React Joyride v3 | @floating-ui/react-dom | ~5kB (includes React bindings) |
| Shepherd.js | @floating-ui/dom (bundled) | ~3kB (not tree-shakeable from Shepherd) |
| Reactour | @popperjs/core | ~7kB (no tree-shaking) |
| Driver.js | Custom (no Floating UI/Popper) | 0kB (built-in math) |
| Intro.js | Custom (no Floating UI/Popper) | 0kB (built-in math) |

Driver.js and Intro.js avoid the positioning dependency entirely by rolling their own math. That saves bundle weight but sacrifices edge-case handling: boundary detection, virtual elements, platform-specific scroll offsets, RTL support.

## Floating UI's React integration for tours

`@floating-ui/react` adds interaction hooks beyond pure positioning. `useFloating` handles the positioning lifecycle, while `useDismiss`, `useRole`, and `useFocus` handle accessibility and interaction patterns.

```tsx
// src/components/TourTooltip.tsx
import {
  useFloating, offset, flip, shift,
  useRole, useDismiss, useInteractions, FloatingPortal,
} from '@floating-ui/react';

function TourTooltip({ referenceEl, content, onDismiss }) {
  const { refs, floatingStyles, context } = useFloating({
    elements: { reference: referenceEl },
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    placement: 'bottom',
  });

  const dismiss = useDismiss(context, { escapeKey: true });
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
        {content}
        <button onClick={onDismiss}>Got it</button>
      </div>
    </FloatingPortal>
  );
}
```

About 30 lines for a positioned, keyboard-dismissible, ARIA-labeled tour tooltip.

## CSS anchor positioning: the browser-native alternative

The CSS Anchor Positioning API is shipping in Chrome 125+ and Edge but three things block adoption for tours in 2026: no Safari support, no programmatic update control, and no middleware equivalent for custom positioning logic.

## Common positioning mistakes to avoid

**Forgetting `autoUpdate()` cleanup.** Floating UI's `autoUpdate()` returns a cleanup function that must be called on unmount. Skip it and you get memory leaks.

**Using `position: absolute` instead of `transform`.** `transform: translate()` avoids triggering layout recalculation on every reposition.

**Hardcoding placement without flip middleware.** Always include `flip()`, even if you think your layout won't need it.

## Migrating from Popper.js to Floating UI

| Popper.js concept | Floating UI equivalent | Notes |
|---|---|---|
| createPopper() | computePosition() | Async; returns a Promise |
| Modifier: offset | offset() middleware | Same API, different import |
| Modifier: flip | flip() middleware | fallbackPlacements works the same |
| Modifier: preventOverflow | shift() middleware | Renamed |
| Modifier: arrow | arrow() middleware | Returns { x, y } instead of modifying style |
| popper.update() | Call computePosition() again | Or use autoUpdate() |
| popper.destroy() | autoUpdate() cleanup function | Returns cleanup on unmount |

The biggest behavioral change: `computePosition()` doesn't apply styles to the DOM. It returns `{ x, y }` and you handle the DOM update yourself.

## FAQ

### Is Popper.js still maintained in 2026?

Popper.js receives no active development as of April 2026. The last meaningful release was in late 2022, and the official README directs developers to Floating UI.

### What is the bundle size difference?

`@floating-ui/dom` ships at roughly 3kB gzipped with tree-shaking. `@popperjs/core` ships at roughly 7kB gzipped with no tree-shaking. That 4kB gap matters in tour libraries where positioning sits alongside step management, overlays, and analytics.

---

*Full article with migration table, code examples, and CSS anchor positioning analysis: [usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning](https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning)*
