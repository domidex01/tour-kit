---
title: "How to add hotspots to your React app"
slug: "react-hotspot-component"
canonical: https://usertourkit.com/blog/react-hotspot-component
tags: react, javascript, web-development, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-hotspot-component)*

# How to add hotspots to your React app

You shipped a new feature and nobody noticed. The button sits there, perfectly styled, completely ignored. This is the exact problem hotspots solve — those small pulsing dots that draw attention to specific UI elements without blocking the user's workflow.

Most React hotspot implementations get the visual part right and the accessibility part wrong. Tooltips that can't be dismissed via keyboard. Beacon animations that ignore `prefers-reduced-motion`. Hover content that vanishes before you can read it. WCAG 1.4.13 requires hover/focus content to be dismissable, hoverable, and persistent, and most tutorials skip all three.

This tutorial walks through building accessible React hotspot components using Tour Kit's `@tour-kit/hints` package — under 10KB gzipped, with Floating UI positioning, keyboard dismissal, and independent state management per hotspot.

```bash
npm install @tour-kit/core @tour-kit/hints
```

## What you'll build

Three hotspots attached to different dashboard elements, each with independent open/dismiss state and WCAG-compliant keyboard navigation. About 40 lines of application code total.

## Step 1: install Tour Kit hints

```bash
npm install @tour-kit/core @tour-kit/hints
```

Both packages together add under 10KB gzipped. They tree-shake cleanly.

## Step 2: wrap your app with HintsProvider

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

The `HintsProvider` manages all hotspot state through a React reducer. Only one tooltip can be open at a time.

## Step 3: add your first hotspot

```tsx
// src/components/Dashboard.tsx
import { Hint } from '@tour-kit/hints'

export function Dashboard() {
  return (
    <div>
      <button id="export-btn">Export Data</button>

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

The `target` prop accepts a CSS selector string or a React ref. The hotspot renders as a `<button>` with `aria-expanded` and `aria-label="Show hint"`.

## Step 4: add multiple hotspots

```tsx
<Hint
  id="export-hint"
  target="#export-btn"
  content="New: export your data as CSV or PDF."
  position="top-right"
  color="primary"
/>

<Hint
  id="chart-hint"
  target="#chart-panel"
  content="Hover over bars to see daily breakdown."
  position="center"
  persist={true}
/>
```

Setting `persist={true}` means clicking close permanently dismisses the hint. Without it, the pulsing dot stays visible for reopening.

## Step 5: use refs for dynamic elements

```tsx
import { useRef } from 'react'
import { Hint } from '@tour-kit/hints'

export function FeaturePanel() {
  const chartRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <div ref={chartRef} className="chart-container" />
      <Hint
        id="chart-interaction-hint"
        target={chartRef}
        content="Drag to zoom into a specific time range."
        position="bottom-right"
      />
    </div>
  )
}
```

## Step 6: programmatic control with useHint

```tsx
import { useHint, useHints } from '@tour-kit/hints'

export function OnboardingControls() {
  const exportHint = useHint('export-hint')
  const { resetAllHints } = useHints()

  return (
    <div>
      <button onClick={() => exportHint.show()}>Show hint</button>
      <button onClick={() => exportHint.dismiss()}>Dismiss</button>
      <button onClick={() => resetAllHints()}>Reset all</button>
    </div>
  )
}
```

## Comparison table

| Feature | Tour Kit Hints | React Joyride Beacon | Custom CSS-only |
|---|---|---|---|
| Bundle size (gzipped) | <10KB | ~37KB | 0KB |
| WCAG 1.4.13 compliant | Yes | Partial | No |
| Independent state | Yes | No (tour-step model) | Manual |
| Headless option | Yes | Limited | N/A |
| prefers-reduced-motion | Built-in | Not built-in | Manual |

Full article with troubleshooting and FAQ: [usertourkit.com/blog/react-hotspot-component](https://usertourkit.com/blog/react-hotspot-component)

---

*Tour Kit is a headless product tour library for React. [GitHub](https://github.com/AmanVarshney01/tour-kit) | [Docs](https://usertourkit.com/docs/hints/getting-started)*
