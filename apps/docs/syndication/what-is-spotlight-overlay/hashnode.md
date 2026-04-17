---
title: "What is a spotlight overlay? Element highlighting explained"
slug: "what-is-spotlight-overlay"
canonical: https://usertourkit.com/blog/what-is-spotlight-overlay
tags: react, javascript, web-development, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-spotlight-overlay)*

# What is a spotlight overlay? Element highlighting explained

You click a "Start tour" button and the screen dims. One button stays bright, sitting inside a rounded cutout in the dark layer. A tooltip next to it says "Click here to create your first project." That bright cutout is a spotlight overlay.

The pattern shows up in almost every product tour and onboarding flow. Notion, Figma, Slack all use it. If you're building a React app, you'll probably need one too.

## Definition

A spotlight overlay is a full-screen semi-transparent layer with a transparent cutout positioned over a target UI element, dimming the background to draw the user's eye to a specific control or section. [Atlassian's design system](https://atlassian.design/components/spotlight/) defines it as a component that "introduces users to points of interest, from focused messages to multi-step tours." Unlike a modal dialog, which blocks the entire interface, the spotlight overlay lets the user see and interact with the highlighted element in its original context.

## How spotlight overlays work

Every spotlight overlay follows the same three-step mechanic: a `position: fixed` element covers the viewport with a semi-transparent background, JavaScript reads the target element's position via `getBoundingClientRect()` and cuts a transparent hole at those coordinates, and a tooltip anchors to the cutout with context or a call to action.

Three CSS approaches exist:

| Technique | Shapes | Blocks interaction | Complexity |
|---|---|---|---|
| `box-shadow` on target | Rectangle only | No (visual-only) | ~5 lines CSS |
| `clip-path` with evenodd fill | Any shape | Yes (true overlay) | ~30 lines JS + CSS |
| SVG `<clipPath>` | Arbitrary | Yes | ~50 lines JS + SVG |

Most tour libraries use `clip-path`. You define two path regions (full viewport + target rectangle), then apply `fill-rule: evenodd` so the overlap becomes transparent.

A fourth technique, `mix-blend-mode`, creates a visual glow but doesn't block pointer events beneath the overlay. React Joyride used this approach historically, leading to broken spotlights in dark mode.

## Code example

```tsx
import { createPortal } from 'react-dom';

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

## Why spotlight overlays matter

As of April 2026, [Plotline's research](https://www.plotline.so/blog/coachmarks-and-spotlight-ui-mobile-apps/) reports that 70% of app features go undiscovered without active user guidance, and strategic spotlight implementations improve feature adoption by 40-60%.

Russell Brown, Senior Product Designer at [Chameleon](https://www.chameleon.io/blog/new-design-patterns-highlighting-elements): "Focus on one element at a time. Highlighting something prevents users feeling overwhelmed."

## Accessibility

Spotlight overlays must meet [WCAG 2.2 SC 2.4.11 (Focus Not Obscured)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum). Treat the spotlight as a modal dialog: `role="dialog"`, `aria-modal="true"`, focus trap within tooltip controls, Escape to dismiss, and focus restoration on close.

---

Full article with more code examples: [usertourkit.com/blog/what-is-spotlight-overlay](https://usertourkit.com/blog/what-is-spotlight-overlay)
