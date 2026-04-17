---
title: "Z-Index Wars: How Product Tour Overlays Actually Work"
published: false
description: "Why z-index: 9999 fails in product tour overlays, and the three CSS strategies that actually fix it: React portals, token systems, and the browser's native top layer."
tags: css, react, web-development, frontend
canonical_url: https://usertourkit.com/blog/z-index-product-tour-overlay
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/z-index-product-tour-overlay)*

# Z-Index Wars: How Product Tour Overlays Actually Work

You set `z-index: 9999` on your tour overlay. It disappears behind a sidebar. You bump it to `99999`. Now it covers the sidebar but hides behind a modal. Someone on your team adds `will-change: transform` to a card component for smoother animations, and your tour overlay vanishes again.

This isn't a z-index problem. It's a stacking context problem.

## Understanding Stacking Contexts

A CSS stacking context is an independent layering scope. Elements inside one can only compete for visual ordering with their siblings in that same context. As of April 2026, MDN documents 17 CSS properties that create new stacking contexts. Most do it silently.

The folder analogy works well: once a sheet of paper is inside a folder, it can never sit between sheets in a different folder, regardless of the number written on it.

## The 17 Stacking Context Triggers

An audit of 12 production React applications found an average of 47 stacking contexts per page, with only 8 intentional. The rest came from animation libraries, performance hints, and glassmorphism effects.

Key surprise triggers:

- **opacity < 1** — Every fade animation creates a stacking context
- **transform: any** — Framer Motion adds this to every animated element
- **will-change: transform** — A performance hint that silently breaks overlay positioning
- **backdrop-filter** — Growing with glassmorphism trends (34% of Chromium pages)
- **position: fixed/sticky** — No z-index value needed to trigger

## Three Strategies That Work

### 1. React Portals

`ReactDOM.createPortal()` teleports overlay output to `document.body`, escaping all stacking contexts in the application component tree. Used by React Joyride (603K weekly npm downloads), Floating UI, and most modern tour libraries.

### 2. CSS Custom Property Token Systems

Define the z-index scale once using CSS custom properties:

```css
:root {
  --z-dropdown: 100;
  --z-modal: 400;
  --z-tour-overlay: 600;
  --z-tour-tooltip: 700;
}
```

Every component references tokens instead of magic numbers. Teams coordinate through a shared scale instead of an arms race.

### 3. The Browser's Native Top Layer

The `<dialog>` element with `showModal()` bypasses z-index entirely. At 96.3% browser support (April 2026), it's production-ready. It also automatically traps focus and makes background content inert, satisfying WCAG 2.2 accessibility requirements.

## Component Library Z-Index Conflict Matrix

| Library | Modal | Popover | Tooltip | Strategy |
|---------|:-----:|:-------:|:-------:|----------|
| MUI | 1300 | 1400 | 1500 | Global scale |
| Radix/shadcn | Portal | Portal | Portal | No fixed z-index |
| Chakra UI | 1400 | 1500 | 1800 | Token scale |
| Ant Design | 1000 | 1030 | 1070 | Offset scale |

---

Full article with code examples, debugging tool recommendations, and the `isolation: isolate` pattern for library authors: [usertourkit.com/blog/z-index-product-tour-overlay](https://usertourkit.com/blog/z-index-product-tour-overlay)
