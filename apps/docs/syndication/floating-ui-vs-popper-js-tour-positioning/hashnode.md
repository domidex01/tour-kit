---
title: "Floating UI vs Popper.js for tour positioning: 2026 comparison"
slug: "floating-ui-vs-popper-js-tour-positioning"
canonical: https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning)*

# Floating UI vs Popper.js for tour positioning: 2026 comparison

If you're building product tours, tooltips, or popovers in 2026, you've probably noticed the confusing naming situation. Popper.js, `@popperjs/core`, Floating UI, `@floating-ui/dom`, `@floating-ui/react`. They all solve the same core problem (positioning a floating element next to a reference element), but they're different libraries at different stages of their lifecycle. One is actively maintained. The other hasn't shipped a release since 2022.

We use Floating UI internally in Tour Kit's positioning engine, so we've spent real time with both libraries and their quirks. This article covers what actually changed between them, where Popper.js falls short today, and how to pick the right positioning library for your tour or tooltip system.

## Key differences at a glance

- **Floating UI**: 30,380 GitHub stars, 6.25M weekly npm downloads, ~3kB gzipped, tree-shakeable middleware, TypeScript-first, async positioning
- **Popper.js**: 8.7M weekly downloads (legacy installs), ~7kB gzipped, no tree-shaking, last meaningful update in 2022

## The middleware system vs modifiers

Floating UI replaced Popper.js modifiers with middleware: pure functions that compose left to right.

```tsx
// Floating UI
import { computePosition, offset, flip, shift } from '@floating-ui/dom';

const { x, y } = await computePosition(referenceEl, tooltipEl, {
  middleware: [offset(8), flip(), shift({ padding: 5 })],
});
```

## Which tour libraries use which engine

| Tour library | Positioning engine | Bundle impact |
|---|---|---|
| Tour Kit | @floating-ui/dom | ~3kB (tree-shaken) |
| React Joyride v3 | @floating-ui/react-dom | ~5kB |
| Shepherd.js | @floating-ui/dom (bundled) | ~3kB |
| Reactour | @popperjs/core | ~7kB |
| Driver.js | Custom | 0kB |

## Migration path

The concepts map one-to-one: `createPopper()` becomes `computePosition()`, modifiers become middleware, and `preventOverflow` is renamed to `shift()`. The biggest change: Floating UI returns coordinates instead of modifying the DOM directly.

Read the full article with React code examples, CSS anchor positioning comparison, and common mistakes to avoid:

**[Full article on usertourkit.com](https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning)**
