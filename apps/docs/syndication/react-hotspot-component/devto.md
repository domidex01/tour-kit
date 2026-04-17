---
title: "Build accessible hotspot components in React (with keyboard dismiss + motion preferences)"
published: false
description: "Most React hotspot tutorials skip accessibility entirely. Here's how to build pulsing beacon hotspots with WCAG 1.4.13 compliance, Floating UI positioning, and independent dismiss state — under 10KB."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/react-hotspot-component
cover_image: https://usertourkit.com/og-images/react-hotspot-component.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-hotspot-component)*

# How to add hotspots to your React app

You shipped a new feature and nobody noticed. The button sits there, perfectly styled, completely ignored. This is the exact problem hotspots solve — those small pulsing dots that draw attention to specific UI elements without blocking the user's workflow.

Most React hotspot implementations get the visual part right and the accessibility part wrong. Tooltips that can't be dismissed via keyboard. Beacon animations that ignore `prefers-reduced-motion`. Hover content that vanishes before you can read it. WCAG 1.4.13 requires hover/focus content to be dismissable, hoverable, and persistent ([WCAG Authors Guide](https://www.wcag.com/authors/1-4-13-content-on-hover-or-focus/)), and most tutorials skip all three.

We tested a dozen hotspot approaches while building Tour Kit, and the gotcha that kept coming up was tooltip positioning on scroll. Tour Kit's `@tour-kit/hints` package gives you hotspot components that handle positioning, accessibility, and dismissal state without fighting your design system. You control the rendering. By the end of this tutorial, you'll have working hotspots attached to real UI elements in a React + TypeScript project.

One honest caveat: Tour Kit requires React 18+ and doesn't have a visual builder. You'll be writing JSX, not dragging and dropping.

```bash
npm install @tour-kit/core @tour-kit/hints
```

## What you'll build

A React hotspot component is a small visual indicator, typically a pulsing dot, anchored to a specific element in your UI. When a user clicks or focuses the hotspot, a tooltip appears with contextual information about that feature. Tour Kit's `<Hint>` component handles element tracking, tooltip positioning via Floating UI, keyboard dismissal, and state management through a reducer-based context. You'll build three hotspots attached to different dashboard elements, each with independent open/dismiss state and WCAG-compliant keyboard navigation.

The full example runs in about 40 lines of application code. The library handles the hard parts.

## Prerequisites

- React 18.2+ or React 19
- TypeScript 5.0+
- A working React project (Vite, Next.js, or Create React App all work)
- Familiarity with React hooks and context

## Step 1: install Tour Kit hints

Tour Kit splits its functionality across focused packages so you only ship what you use. For hotspots, you need two: `@tour-kit/core` provides the positioning engine and shared types, while `@tour-kit/hints` adds the hotspot components and state management layer on top.

```bash
# npm
npm install @tour-kit/core @tour-kit/hints

# pnpm
pnpm add @tour-kit/core @tour-kit/hints

# yarn
yarn add @tour-kit/core @tour-kit/hints
```

Both packages together add under 10KB gzipped to your bundle. They tree-shake cleanly, so if you only use the `<Hint>` component, unused exports like `useHints()` get eliminated at build time.

## Step 2: wrap your app with HintsProvider

Every hotspot needs access to shared state so that opening one tooltip automatically closes any other. The `HintsProvider` component manages this through a React reducer, tracking registered hints, open state, and permanent dismissals.

Each `<Hint>` registers itself on mount and unregisters on unmount, so the provider always knows what's active.

```tsx
// src/App.tsx
import { HintsProvider } from '@tour-kit/hints'

export function App() {
  return (
    <HintsProvider>
      <Dashboard />
    </HintsProvider>
  )
}
```

Place `HintsProvider` high enough in your tree that it wraps every component containing a hotspot. If you're using Next.js App Router, add it to your root layout as a client component.

## Step 3: add your first hotspot

Pass the `<Hint>` component a CSS selector or React ref pointing to your target element, and it handles everything else: tracking element position as the page reflows, rendering the pulsing dot at the correct offset, showing the tooltip on click, and closing it on Escape or outside click.

```tsx
// src/components/Dashboard.tsx
import { Hint } from '@tour-kit/hints'

export function Dashboard() {
  return (
    <div>
      <button id="export-btn">Export Data</button>
      <button id="filter-btn">Filters</button>
      <section id="chart-panel">
        <h2>Revenue chart</h2>
        {/* ... chart content ... */}
      </section>

      {/* Hotspot targeting the export button */}
      <Hint
        id="export-hint"
        target="#export-btn"
        content="New: export your data as CSV or PDF with one click."
        position="top-right"
        tooltipPlacement="bottom"
      />
    </div>
  )
}
```

Selectors like `"#export-btn"` or `".my-class"` work, and so do React refs (more on that in Step 5). Tour Kit watches for the element's position and updates the hotspot if the layout shifts.

Under the hood, the hotspot renders as a `<button>` with `aria-expanded` to indicate tooltip state and `aria-label="Show hint"` for screen readers. When open, the tooltip portals to the document body via Floating UI and positions itself relative to the hotspot button.

## Step 4: add multiple hotspots with different configurations

Multiple hotspots can coexist on the same page, each with its own position, color variant, and tooltip placement. The `HintsProvider` tracks all registered hints and enforces a single-open constraint: clicking one hotspot automatically closes any other open tooltip.

```tsx
// src/components/Dashboard.tsx
import { Hint } from '@tour-kit/hints'

export function Dashboard() {
  return (
    <div>
      <button id="export-btn">Export Data</button>
      <button id="filter-btn">Filters</button>
      <section id="chart-panel">
        <h2>Revenue chart</h2>
      </section>

      <Hint
        id="export-hint"
        target="#export-btn"
        content="New: export your data as CSV or PDF."
        position="top-right"
        tooltipPlacement="bottom"
        color="primary"
        size="md"
      />

      <Hint
        id="filter-hint"
        target="#filter-btn"
        content="Try the new date range filter."
        position="top-left"
        tooltipPlacement="right"
        color="secondary"
      />

      <Hint
        id="chart-hint"
        target="#chart-panel"
        content="Hover over bars to see daily breakdown."
        position="center"
        tooltipPlacement="top"
        persist={true}
      />
    </div>
  )
}
```

Setting `persist={true}` on the chart hint means clicking the close button permanently dismisses it (stored as `isDismissed: true`). Without `persist`, closing the tooltip just hides it temporarily and the pulsing dot stays visible for reopening.

Position options: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center`. Tooltip placement supports all 12 Floating UI positions (`top`, `bottom`, `left`, `right`, plus `-start` and `-end` variants).

## Step 5: use refs for dynamically rendered elements

CSS selectors work for elements that exist in the DOM at render time, but you'll often need to attach hotspots to elements inside modals, lazy-loaded components, or conditional renders. In those cases, pass a React ref to the `target` prop instead.

```tsx
// src/components/FeaturePanel.tsx
import { useRef } from 'react'
import { Hint } from '@tour-kit/hints'

export function FeaturePanel() {
  const chartRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <div ref={chartRef} className="chart-container">
        {/* Dynamically loaded chart */}
      </div>

      <Hint
        id="chart-interaction-hint"
        target={chartRef}
        content="Drag to zoom into a specific time range."
        position="bottom-right"
        tooltipPlacement="left"
      />
    </div>
  )
}
```

If the target element isn't in the DOM yet, the hotspot simply doesn't render. No errors, no flash of misplaced content. Once the element appears, `useElementPosition` picks it up and recalculates on scroll, resize, and layout shifts.

## Step 6: control hotspots programmatically with useHint

Sometimes you need to show a hotspot after a user completes an action, dismiss all hints when onboarding finishes, or wire hint events into your analytics pipeline. The `useHint` hook gives you direct control over individual hint state, while `useHints` exposes bulk operations across all registered hints.

```tsx
// src/components/OnboardingControls.tsx
import { useHint, useHints } from '@tour-kit/hints'

export function OnboardingControls() {
  const exportHint = useHint('export-hint')
  const { resetAllHints } = useHints()

  return (
    <div>
      <p>
        Export hint: {exportHint.isOpen ? 'open' : 'closed'}
        {exportHint.isDismissed && ' (dismissed)'}
      </p>

      <button onClick={() => exportHint.show()}>
        Show export hint
      </button>

      <button onClick={() => exportHint.dismiss()}>
        Dismiss permanently
      </button>

      <button onClick={() => resetAllHints()}>
        Reset all hints
      </button>
    </div>
  )
}
```

`useHint(id)` returns `{ isOpen, isDismissed, show, hide, dismiss, reset }`. All callbacks are memoized with `useCallback`, so they're safe to include in dependency arrays.

## Common issues and troubleshooting

### "Hotspot doesn't appear on the page"

Check that your target selector matches an element that exists when the `<Hint>` mounts. If the element renders later (inside a lazy-loaded route, for example), use a ref instead of a selector.

Also verify `HintsProvider` wraps the component tree containing your hints. Without the provider, `useHint` throws a context error.

### "Tooltip appears in the wrong position"

Floating UI recalculates position on scroll and resize, but if your target element moves due to an animation or CSS transition, the tooltip may lag behind. Use `autoShow={false}` and trigger the tooltip after animations complete.

### "Pulse animation doesn't respect reduced motion"

Tour Kit's hotspot variants include a `prefers-reduced-motion` media query that disables the CSS pulse animation automatically. If you're using a custom `className` that overrides the animation, add your own motion check:

```css
@media (prefers-reduced-motion: reduce) {
  .my-custom-hotspot {
    animation: none;
  }
}
```

## Hotspot approaches compared

| Feature | Tour Kit Hints | React Joyride Beacon | Custom CSS-only |
|---|---|---|---|
| Bundle size (gzipped) | <10KB (core + hints) | ~37KB (full library) | 0KB (CSS only) |
| WCAG 1.4.13 compliant | Yes (dismiss, hover, persist) | Partial (no keyboard dismiss) | No (requires JS) |
| Tooltip positioning | Floating UI (flip, shift, offset) | react-floater (Popper.js) | Manual CSS |
| Independent state per hotspot | Yes (reducer-based context) | No (tour-step model) | Manual |
| Headless / unstyled option | Yes (asChild + variants) | Limited | N/A |
| prefers-reduced-motion | Built-in | Not built-in | Manual |
| Best for | Feature discovery | Sequential tours | Simple indicators |

React Joyride's beacon is designed for sequential tours, not standalone hotspots. If you need independent feature hints that persist across sessions and operate outside a tour flow, a dedicated hotspot component is the better fit.

## FAQ

### What is a hotspot component in React?

A React hotspot component is a small visual indicator (usually a pulsing dot) that attaches to a specific element in your UI. Clicking or focusing it reveals a tooltip with contextual help. Tour Kit's `<Hint>` component provides this pattern with built-in accessibility, Floating UI positioning, and independent state per hotspot.

### Does adding hotspots affect React app performance?

Tour Kit's hints package adds under 10KB gzipped to your bundle. The hotspot uses `position: fixed` with pre-calculated coordinates, so it doesn't trigger layout recalculations. Floating UI's `autoUpdate` listener only runs when a tooltip is actually open.

### How do I make React hotspots accessible?

WCAG 1.4.13 requires hover/focus content to be dismissable and persistent. Tour Kit's `<Hint>` meets both. The hotspot is a focusable `<button>` with `aria-expanded`, Escape dismissal works via Floating UI's `useDismiss`, and the pulse respects `prefers-reduced-motion`.

### How is Tour Kit different from React Joyride for hotspots?

React Joyride's beacon is tied to its sequential tour model. Beacons exist as entry points into tour steps, not as independent elements. Tour Kit's `@tour-kit/hints` treats each hotspot as a standalone unit with its own state. You can show, hide, dismiss, and reset individual hotspots without affecting others.

### Can I use hotspots on mobile and touch devices?

Tour Kit's hotspots use click events (not hover), which translates directly to tap on touch devices. By using tap as the trigger, Tour Kit sidesteps the fundamental touch accessibility problem where tooltips can't be focused without activating the underlying element.

---

*Tour Kit is a headless, composable product tour library for React. [View on GitHub](https://github.com/AmanVarshney01/tour-kit) | [Documentation](https://usertourkit.com/docs/hints/getting-started)*
