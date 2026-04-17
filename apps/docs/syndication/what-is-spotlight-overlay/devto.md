---
title: "Spotlight overlays: how they work and why every product tour uses them"
published: false
description: "A spotlight overlay dims the screen and cuts a hole around a UI element to grab attention. Here's how the pattern works under the hood — clip-path, box-shadow, mix-blend-mode compared."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/what-is-spotlight-overlay
cover_image: https://usertourkit.com/og-images/what-is-spotlight-overlay.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-spotlight-overlay)*

# What is a spotlight overlay? Element highlighting explained

You click a "Start tour" button and the screen dims. One button stays bright, sitting inside a rounded cutout in the dark layer. A tooltip next to it says "Click here to create your first project." That bright cutout is a spotlight overlay.

The pattern shows up in almost every product tour and onboarding flow. Notion, Figma, Slack all use it. If you're building a React app, you'll probably need one too.

```bash
npm install @tourkit/core @tourkit/react
```

Tour Kit ships a spotlight overlay out of the box. But understanding the mechanics makes you a better consumer of any library.

## Definition

A spotlight overlay is a full-screen semi-transparent layer with a transparent cutout positioned over a target UI element, dimming the background to draw the user's eye to a specific control or section. [Atlassian's design system](https://atlassian.design/components/spotlight/) defines it as a component that "introduces users to points of interest, from focused messages to multi-step tours." Unlike a modal dialog, which blocks the entire interface, the spotlight overlay lets the user see and interact with the highlighted element in its original context.

## How spotlight overlays work

Every spotlight overlay follows the same three-step mechanic: a `position: fixed` element covers the viewport with a semi-transparent background (`rgba(0, 0, 0, 0.5)` to `rgba(0, 0, 0, 0.75)`), JavaScript reads the target element's position via `getBoundingClientRect()` and cuts a transparent hole at those coordinates, and a tooltip anchors to the cutout with context or a call to action. The cutout technique is where implementations diverge. Three CSS approaches exist, each with real trade-offs:

| Technique | Shapes | Blocks interaction | Complexity |
|---|---|---|---|
| `box-shadow` on target | Rectangle only | No (shadow is visual-only) | ~5 lines CSS |
| `clip-path` with evenodd fill | Any shape (rounded, custom) | Yes (true overlay layer) | ~30 lines JS + CSS |
| SVG `<clipPath>` | Arbitrary (circle, polygon) | Yes | ~50 lines JS + SVG |

Most tour libraries use `clip-path`. You define two path regions (full viewport + target rectangle), then apply `fill-rule: evenodd` so the overlap becomes transparent. As [a DEV Community tutorial](https://dev.to/thanasistraitsis/creating-spotlight-tutorials-in-flutter-the-complete-guide-to-selective-overlays-4iil) puts it: "It's layering rather than modification."

A fourth technique, `mix-blend-mode`, creates a visual glow but doesn't block pointer events beneath the overlay. React Joyride used this approach historically, which is why its [GitHub issues](https://github.com/gilbarbara/react-joyride/issues) include dozens of broken-spotlight reports in dark mode.

## Spotlight overlay examples

The core of a `clip-path` spotlight in React is about 15 lines of meaningful code. Read the target's bounding rect, build an SVG path with two regions, apply `evenodd` fill, and render through a portal. Here's the key fragment:

```tsx
// src/components/SpotlightOverlay.tsx
import { createPortal } from 'react-dom';

// After reading target rect via getBoundingClientRect():
const path = `M0,0 H${window.innerWidth} V${window.innerHeight} H0Z
  M${rect.x - pad},${rect.y - pad + r}
  a${r},${r} 0 0 1 ${r},-${r}
  h${rect.width + pad * 2 - r * 2}
  a${r},${r} 0 0 1 ${r},${r}
  v${rect.height + pad * 2 - r * 2}
  a${r},${r} 0 0 1 -${r},${r}
  h-${rect.width + pad * 2 - r * 2}
  a${r},${r} 0 0 1 -${r},-${r}z`;

return createPortal(
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)',
      clipPath: `path(evenodd, "${path}")`,
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Feature spotlight"
  />,
  document.body
);
```

For the full implementation with scroll/resize tracking and `ResizeObserver`, see the tutorial: [How to create a spotlight highlight effect in React](https://usertourkit.com/blog/react-spotlight-highlight-component).

## Why spotlight overlays matter

As of April 2026, [Plotline's research](https://www.plotline.so/blog/coachmarks-and-spotlight-ui-mobile-apps/) reports that 70% of app features go undiscovered without active user guidance, and strategic spotlight implementations improve feature adoption by 40-60%. The pattern works because it manages attention. Russell Brown, Senior Product Designer at [Chameleon](https://www.chameleon.io/blog/new-design-patterns-highlighting-elements), puts it plainly: "Focus on one element at a time. Highlighting something prevents users feeling overwhelmed."

Poorly implemented spotlights create the opposite effect. Tooltip copy past 140 characters overwhelms users mid-task. Generic page-load spotlights annoy returning users. The 2026 trend is behavior-triggered spotlights: show the highlight when a user first encounters a feature, not on every page load.

## Spotlight overlays in Tour Kit

Tour Kit's `@tourkit/react` package ships a spotlight overlay using `clip-path` with GPU-accelerated CSS transforms, scroll tracking via `ResizeObserver`, and `prefers-reduced-motion` support, all in a core bundle under 8KB gzipped. It doesn't include a visual builder, so you write JSX to define steps. That means it works with any design system (shadcn/ui, Radix, Tailwind) but requires a developer to set up. For no-code spotlight builders, Appcues or Chameleon might be a better fit.

Get started at [usertourkit.com](https://usertourkit.com/).

## Accessibility requirements for spotlight overlays

Spotlight overlays must meet [WCAG 2.2 SC 2.4.11 (Focus Not Obscured)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum), which requires that focused elements aren't hidden by the overlay. The cutout satisfies this for the target element, but the tooltip controls (Next, Back, Skip) need proper focus management too. Treat the spotlight as a modal dialog: `role="dialog"`, `aria-modal="true"`, focus trap within tooltip controls, Escape to dismiss, and focus restoration on close.

## FAQ

### What is the difference between a spotlight overlay and a tooltip?

A spotlight overlay dims the entire screen and cuts a transparent hole around the target element, blocking interaction with the rest of the page. A tooltip is a floating label that appears on hover or focus without dimming anything. Spotlights often contain a tooltip inside the cutout, but the full-screen dimming layer is what defines them.

### Can spotlight overlays work without JavaScript?

The dimmed layer works with pure CSS. But cutout positioning requires JavaScript because `getBoundingClientRect()` reads the target element's coordinates at runtime. Hardcoded `clip-path` values are possible for static layouts, though they break across screen sizes. Production spotlight overlays need JavaScript.

### How do spotlight overlays affect page performance?

A spotlight overlay adds one DOM element and runs `getBoundingClientRect()` on scroll and resize. That's cheap. The risk is animating `clip-path` directly, which triggers paint on every frame. Tour Kit avoids this by animating `opacity` and `transform` instead. We measured initialization at under 2ms with 20 steps on Vite + React 19.

### Are spotlight overlays accessible?

They can be, but most implementations get it wrong. The overlay needs `role="dialog"`, `aria-modal="true"`, focus trapping within tooltip controls, Escape key dismissal, and focus restoration on close. WCAG 2.2 SC 2.4.11 requires the highlighted element isn't obscured. Tour Kit's spotlight implements all of these patterns by default.
