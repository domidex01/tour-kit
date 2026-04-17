---
title: "Virtual DOM diffing and product tours: why overlay rendering matters"
slug: "virtual-dom-diffing-product-tours-overlay-rendering"
canonical: https://usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering
tags: react, javascript, web-development, performance
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering)*

# Virtual DOM diffing and product tours: why overlay rendering matters

Every product tour library faces the same problem: rendering a tooltip next to a target element without breaking the rest of your app. How you do it matters more than you'd think.

The answer depends on how well the library works with React's reconciliation process. Get it wrong and you get z-index conflicts, stale positions, and flickering overlays that fight with your component tree. The rendering strategy determines whether step transitions feel instant or cause visible layout thrash.

## The core problem

React's Fiber reconciler compares virtual DOM trees and computes minimal real DOM changes. For overlays, this means a tooltip update either triggers a single attribute change or a full subtree teardown. We measured the difference: type-preserving updates averaged 1.8ms per transition, while full unmount/remount cycles averaged 12.4ms on a mid-range phone.

Three rendering strategies exist for product tour overlays:

| Strategy | React-aware | Escapes stacking context | Reconciliation safe |
|---|---|---|---|
| Inline (child of target) | Yes | No | Yes |
| Portal (createPortal) | Yes | Yes | Yes |
| DOM injection (MutationObserver) | No | Yes | No |

Portal-based rendering is the winner for React apps. It escapes CSS stacking contexts while keeping overlays inside React's fiber tree for proper diffing. Script-injected tools (Appcues, Pendo) that bypass React's vDOM cause reconciliation corruption, flickering, and stale positions.

## Key findings

- `startTransition` for tour step transitions drops input delay from 28ms to under 4ms on mid-range devices
- CSS visibility toggling keeps DOM nodes alive (2KB per step) vs unmount/remount (12.4ms per transition)
- The CSS Anchor Positioning API (Chrome 125+) will eventually eliminate JavaScript-based overlay positioning entirely

Full article with code examples, comparison table, and implementation patterns: [usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering](https://usertourkit.com/blog/virtual-dom-diffing-product-tours-overlay-rendering)
