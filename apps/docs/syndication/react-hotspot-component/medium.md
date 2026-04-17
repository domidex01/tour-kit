# How to Add Hotspots to Your React App

## Build accessible pulsing indicators that actually work with keyboard navigation

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-hotspot-component)*

You shipped a new feature and nobody noticed. The button sits there, perfectly styled, completely ignored. This is the exact problem hotspots solve — those small pulsing dots that draw attention to specific UI elements without blocking the user's workflow.

Most React hotspot implementations get the visual part right and the accessibility part wrong. Tooltips that can't be dismissed via keyboard. Beacon animations that ignore reduced motion preferences. Hover content that vanishes before you can read it.

WCAG 1.4.13 requires hover/focus content to be dismissable, hoverable, and persistent. Most tutorials skip all three.

This tutorial uses Tour Kit's @tour-kit/hints package — under 10KB gzipped — to build hotspots with Floating UI positioning, keyboard dismissal, and independent state management.

## The setup

You need two packages: @tour-kit/core for the positioning engine and @tour-kit/hints for the hotspot components. Install with npm:

    npm install @tour-kit/core @tour-kit/hints

Wrap your app with HintsProvider, which manages all hotspot state through a React reducer. Only one tooltip can be open at a time — opening a new one closes the previous automatically.

    import { HintsProvider } from '@tour-kit/hints'

    export function App() {
      return (
        <HintsProvider>
          <Dashboard />
        </HintsProvider>
      )
    }

## Adding a hotspot

The Hint component takes a CSS selector or React ref as its target. It handles element tracking, tooltip positioning, and keyboard dismissal.

    import { Hint } from '@tour-kit/hints'

    export function Dashboard() {
      return (
        <div>
          <button id="export-btn">Export Data</button>

          <Hint
            id="export-hint"
            target="#export-btn"
            content="New: export as CSV or PDF."
            position="top-right"
            tooltipPlacement="bottom"
          />
        </div>
      )
    }

Under the hood, the hotspot renders as a button with aria-expanded and aria-label="Show hint". The tooltip portals to the document body via Floating UI.

## Multiple hotspots on one page

Each Hint operates independently. Mix positions, colors, and tooltip placements. The HintsProvider enforces a single-open constraint — clicking one hotspot closes any other.

Setting persist={true} means clicking close permanently dismisses the hint. Without it, closing just hides the tooltip temporarily.

## Programmatic control

The useHint hook gives you direct control:

    const exportHint = useHint('export-hint')
    exportHint.show()    // open the tooltip
    exportHint.dismiss() // permanently dismiss
    exportHint.reset()   // un-dismiss

useHints() gives you bulk operations like resetAllHints() for admin panels or debug tools.

## How it compares

Tour Kit Hints adds under 10KB gzipped versus React Joyride's roughly 37KB. More importantly, Joyride's beacon is tied to its sequential tour model — beacons are entry points into tour steps, not standalone elements. Tour Kit treats each hotspot as an independent unit.

For pure CSS hotspots, you get the visual indicator for free but miss keyboard dismissal, Escape handling, and reduced motion support — all WCAG 1.4.13 requirements.

## What's next

- Connect HintsProvider to localStorage for persistent dismissal state
- Combine @tour-kit/react for sequential tours with @tour-kit/hints for feature discovery
- Wire onShow and onDismiss callbacks to your analytics

Full article with comparison table, troubleshooting, and FAQ: [usertourkit.com/blog/react-hotspot-component](https://usertourkit.com/blog/react-hotspot-component)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
