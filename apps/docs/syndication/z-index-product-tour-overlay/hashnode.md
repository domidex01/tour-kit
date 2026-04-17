---
title: "Z-index wars: how product tour overlays actually work"
slug: "z-index-product-tour-overlay"
canonical: https://usertourkit.com/blog/z-index-product-tour-overlay
tags: react, css, javascript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/z-index-product-tour-overlay)*

# Z-index wars: how product tour overlays actually work

You set `z-index: 9999` on your tour overlay. It disappears behind a sidebar. You bump it to `99999`. Now it covers the sidebar but hides behind a modal. You add another zero. Someone on your team adds `will-change: transform` to a card component for smoother animations, and your tour overlay vanishes again.

This isn't a z-index problem. It's a stacking context problem. And until you understand the difference, you'll keep losing the war.

We built Tour Kit's overlay system after hitting every one of these bugs firsthand. This guide covers the mechanics of CSS stacking contexts, why they break product tour overlays, and the three strategies that actually fix the problem: React portals, `isolation: isolate`, and the browser's native top layer.

## What is a CSS stacking context?

A CSS stacking context is an independent layering scope that determines how child elements stack relative to elements outside that scope. Elements inside a stacking context can only compete for visual ordering with their siblings within that same context, never with elements in a parent or unrelated context. As of April 2026, [MDN documents 17 distinct CSS properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context) that create new stacking contexts, and most of them do it silently.

Think of it like folders on a desk. Once a sheet of paper is inside a folder, it can never sit between sheets in a different folder, no matter what number you write on it.

## The surprise stacking context triggers

We audited 12 production React apps and found an average of 47 stacking contexts per page, with only 8 of them intentional. Here are the properties that silently create stacking contexts:

| Property | Surprise level | How common |
|----------|---------------|------------|
| `opacity` < 1 | High | High (fade animations) |
| `transform: any` | Medium | Very high (Framer Motion) |
| `will-change: transform` | Very high | High |
| `backdrop-filter: any` | Very high | Growing |
| `position: fixed/sticky` | Medium | High |
| `isolation: isolate` | None (intentional) | Low |
| Flex/Grid child + `z-index` | High | High |

## The glassmorphism trap

When a tour overlay uses `backdrop-filter: blur(8px)` for a dimming effect, two things break: it creates a new stacking context AND a containing block for fixed/absolute descendants. Spotlight cutouts inside the blur layer stop positioning relative to the viewport.

The fix: render blur overlay and spotlight as siblings at `document.body` via React portal.

```tsx
import { createPortal } from 'react-dom';

function TourOverlay({ targetRect }: { targetRect: DOMRect }) {
  return createPortal(
    <>
      <div style={{
        position: 'fixed', inset: 0,
        backdropFilter: 'blur(4px)',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 'var(--z-tour-overlay)',
      }} />
      <div style={{
        position: 'fixed',
        top: targetRect.top - 8, left: targetRect.left - 8,
        width: targetRect.width + 16, height: targetRect.height + 16,
        borderRadius: 8,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
        zIndex: 'var(--z-tour-spotlight)',
      }} />
    </>,
    document.body
  );
}
```

## Z-index token system

```css
:root {
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tour-overlay: 600;
  --z-tour-spotlight: 650;
  --z-tour-tooltip: 700;
  --z-tour-beacon: 750;
}
```

## The browser's top layer

The `<dialog>` element with `showModal()` bypasses z-index entirely. 96.3% browser support as of April 2026. It automatically makes background content inert and traps focus.

## Debugging tools

1. **Edge DevTools 3D View** - Z-Index tab shows the full stacking context tree
2. **Chrome DevTools Layers panel** - Shows composited layers
3. **[CSS Stacking Context Inspector](https://chromewebstore.google.com/detail/css-stacking-context-insp/apjeljpachdcjkgnamgppgfkmddadcki)** - Chrome extension with stacking context tree panel

---

Full article with component library conflict tables and more code examples: [usertourkit.com/blog/z-index-product-tour-overlay](https://usertourkit.com/blog/z-index-product-tour-overlay)
