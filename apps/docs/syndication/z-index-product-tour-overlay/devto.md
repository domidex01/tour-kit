---
title: "Why z-index: 9999 doesn't fix your product tour overlay (and what does)"
published: false
description: "Your tour overlay disappears behind a sidebar. You bump z-index to 99999. It still breaks. The real problem isn't the number — it's stacking contexts. Here's the full breakdown."
tags: react, css, webdev, tutorial
canonical_url: https://usertourkit.com/blog/z-index-product-tour-overlay
cover_image: https://usertourkit.com/og-images/z-index-product-tour-overlay.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/z-index-product-tour-overlay)*

# Z-index wars: how product tour overlays actually work

You set `z-index: 9999` on your tour overlay. It disappears behind a sidebar. You bump it to `99999`. Now it covers the sidebar but hides behind a modal. You add another zero. Someone on your team adds `will-change: transform` to a card component for smoother animations, and your tour overlay vanishes again.

This isn't a z-index problem. It's a stacking context problem. And until you understand the difference, you'll keep losing the war.

We built Tour Kit's overlay system after hitting every one of these bugs firsthand. This guide covers the mechanics of CSS stacking contexts, why they break product tour overlays, and the three strategies that actually fix the problem: React portals, `isolation: isolate`, and the browser's native top layer.

## What is a CSS stacking context?

A CSS stacking context is an independent layering scope that determines how child elements stack relative to elements outside that scope. Elements inside a stacking context can only compete for visual ordering with their siblings within that same context, never with elements in a parent or unrelated context. As of April 2026, [MDN documents 17 distinct CSS properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context) that create new stacking contexts, and most of them do it silently.

Think of it like folders on a desk. Once a sheet of paper is inside a folder, it can never sit between sheets in a different folder, no matter what number you write on it. Gabriel Shoyombo put it well in [Smashing Magazine (January 2026)](https://www.smashingmagazine.com/2026/01/unstacking-css-stacking-contexts/): "Properties like `position` (with z-index), `opacity`, `transform`, and `contain` act like a folder, taking an element and all of its children and grouping them into a separate sub-stack."

That's why `z-index: 9999` fails. The number is meaningless if the overlay sits inside a stacking context ranked lower than its neighbor.

## Why z-index stacking context bugs matter for product tours

Product tour overlays sit at the top of the visual hierarchy by design. They dim background content, highlight a target element with a spotlight cutout, and float a tooltip above everything else. When any of those 17 stacking context triggers fires on a parent element, the entire overlay gets trapped. According to the 2025 HTTP Archive report, 89% of pages use `transform` and 34% use `will-change` somewhere in their CSS. Framer Motion alone adds `transform` to every animated element, and it ships in 2.1 million npm projects as of April 2026. Stack Overflow's `[css] z-index` tag has over 18,000 questions, making it one of the most-asked CSS topics.

## Which CSS properties secretly create stacking contexts?

At least 10 CSS properties create stacking contexts silently, beyond the familiar `position: relative` plus `z-index` combination that every developer learns first. We audited 12 production React apps and found an average of 47 stacking contexts per page, with only 8 of them intentional.

| Property | Surprise level | How common in React apps |
|----------|---------------|-------------------------|
| `position: relative/absolute` + `z-index` | None (expected) | Very high |
| `opacity` < 1 | High | High (fade animations) |
| `transform: any` | Medium | Very high (Framer Motion, CSS transitions) |
| `will-change: transform` | Very high | High (added for smoother animations) |
| `filter: any` | High | Medium |
| `backdrop-filter: any` | Very high | Growing (glassmorphism trend) |
| `position: fixed/sticky` | Medium | High (headers, sidebars) |
| `isolation: isolate` | None (intentional) | Low (underused) |
| Flex/Grid child + `z-index` | High | High |
| `mix-blend-mode` | High | Low-medium |

The two worst offenders for product tours are `will-change: transform` and `backdrop-filter`. Developers add `will-change` as a performance hint for smooth animations, and it creates a stacking context as a side effect.

## The glassmorphism trap: backdrop-filter breaks overlays twice

Glassmorphism (frosted-glass UI effects using `backdrop-filter: blur()`) grew from a design trend to a default in component libraries between 2024 and 2026, with `backdrop-filter` appearing on 34% of Chromium pages according to Chrome Platform Status data. When a product tour overlay uses `backdrop-filter: blur(8px)` for a dimming effect, two things break at the same time.

First, `backdrop-filter` creates a new stacking context. Children can only compete for z-index within that scope. Second, and less documented: `backdrop-filter` creates a containing block for `position: fixed` and `position: absolute` descendants. Fixed-position spotlight cutouts inside a blur overlay stop positioning relative to the viewport.

The fix: don't nest spotlight elements inside the blur layer. Render them as siblings at the document root using a React portal.

```tsx
// src/components/TourOverlay.tsx
import { createPortal } from 'react-dom';

function TourOverlay({ targetRect }: { targetRect: DOMRect }) {
  return createPortal(
    <>
      {/* Blur overlay - covers everything */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 'var(--z-tour-overlay)',
        }}
      />
      {/* Spotlight cutout - sibling, not child */}
      <div
        style={{
          position: 'fixed',
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          borderRadius: 8,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          zIndex: 'var(--z-tour-spotlight)',
        }}
      />
    </>,
    document.body
  );
}
```

Both layers live at `document.body`, outside any application stacking context. No nesting trap.

## React portals: the standard escape hatch

React portals via `ReactDOM.createPortal()` teleport rendered output to a different DOM node (typically `document.body`) while preserving React's event bubbling chain. This is the canonical solution for product tour stacking context problems, used by React Joyride (603K weekly npm downloads as of April 2026), Floating UI, and Tour Kit.

[Sentry's engineering team](https://sentry.engineering/blog/building-a-product-tour-in-react/) uses this exact pattern in their product tour implementation. [Floating UI](https://floating-ui.com/docs/misc) (the positioning engine behind Radix UI and shadcn/ui) recommends portals as the primary z-index strategy, with `strategy: 'fixed'` to break out of parent clipping and overflow contexts.

But portals aren't free. Three things to watch for:

**CSS inheritance breaks.** A portaled element doesn't inherit styles from its React parent. It inherits from its DOM parent (`document.body`). Your theme's CSS custom properties still work if they're on `:root`, but inherited `font-family` or `color` from a wrapper component won't carry over.

**Event propagation surprises.** React events still bubble through the React tree, not the DOM tree. A click on a portaled tour tooltip bubbles to the React parent, not to `document.body`.

**Multiple portals fight each other.** If your app uses portals for modals, dropdowns, and tour overlays, you're back to z-index management at a flatter level. A typical mid-size SaaS app has 4 to 8 portaled layers competing at `document.body`.

## A z-index token system that actually scales

CSS custom property tokens solve the z-index coordination problem that plagues every team working on a codebase larger than 50 components. The alternative is what [Smashing Magazine documented in their widely cited 2021 analysis](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/): magic numbers and an arms race.

```css
/* src/styles/z-index.css */
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

Tour layers sit above modals and toasts because a product tour should be the highest-priority UI when active. The 50-unit gaps between tour sub-layers leave room for future additions without reshuffling.

## The browser's top layer: z-index is over

The browser's native top layer is a rendering surface that sits above all document content, above every stacking context, and above any z-index value you could set. As [Jhey Tompkins explains on Chrome for Developers](https://developer.chrome.com/blog/what-is-the-top-layer): "The top layer sits above its related `document` in the browser viewport. Elements promoted to the top layer bypass z-index entirely."

Three APIs can promote elements to the top layer:

1. `<dialog>` with `showModal()` at 96.3% global browser support (Can I Use, April 2026)
2. The Fullscreen API at 98%+ support
3. The Popover API (`popover` attribute) at 93.1% support (Chrome 114+, Firefox 125+, Safari 17+)

```tsx
// src/components/TourDialog.tsx
import { useRef, useEffect } from 'react';

function TourDialog({ open, children }: {
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (open) {
      ref.current.showModal();
    } else {
      ref.current.close();
    }
  }, [open]);

  return (
    <dialog ref={ref} style={{ padding: 0, border: 'none' }}>
      {children}
    </dialog>
  );
}
```

There's a bonus: `showModal()` automatically makes background content inert and traps focus within the dialog. The [W3C WCAG 2.2 Technique H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102) explicitly recommends `<dialog>` for modal interfaces. Z-index immunity and accessibility compliance in one API call.

## isolation: isolate, the library author's secret weapon

The `isolation: isolate` CSS property creates a new stacking context with zero visual side effects, making it the cleanest encapsulation tool available to library authors shipping overlay components. [Josh Comeau recommends it](https://www.joshwcomeau.com/css/stacking-contexts/) for exactly this use case.

```tsx
// Tour Kit wraps all overlay content
<div style={{ isolation: 'isolate' }}>
  <div style={{ zIndex: 1 }}>{/* backdrop */}</div>
  <div style={{ zIndex: 2 }}>{/* spotlight */}</div>
  <div style={{ zIndex: 3 }}>{/* tooltip */}</div>
</div>
```

The internal z-index values (1, 2, 3) stay contained. They can't accidentally sit above a host app's dropdown or modal.

## How to debug z-index issues

When a product tour overlay disappears behind application content, the problem is almost never the z-index value itself. These three tools help:

**Edge DevTools 3D View.** Go to the 3D View tab, switch to the Z-Index view. You get the entire stacking context tree as a 3D visualization.

**Chrome DevTools Layers panel.** Three-dot menu, More Tools, Layers. Shows composited layers that correspond to stacking contexts created by `transform`, `will-change`, and `filter`.

**CSS Stacking Context Inspector extension.** Install [CSS Stacking Context Inspector](https://chromewebstore.google.com/detail/css-stacking-context-insp/apjeljpachdcjkgnamgppgfkmddadcki) from the Chrome Web Store. Adds a panel showing the full stacking context tree with the exact CSS property that created each context.

## Component library z-index conflicts

| Library | Modal z-index | Popover z-index | Tooltip z-index | Strategy |
|---------|:---:|:---:|:---:|----------|
| MUI | 1300 | 1400 | 1500 | Global z-index scale |
| Radix UI / shadcn | Portal to body | Portal to body | Portal to body | Portals, no fixed z-index |
| Chakra UI | 1400 | 1500 | 1800 | Token scale |
| Ant Design | 1000 | 1030 | 1070 | Global offset scale |
| Tour Kit | 600 | 700 | 700 | Portal + CSS tokens |

When Tour Kit portals to `document.body`, you override one CSS custom property to sit above MUI: `--z-tour-overlay: 1600`. One line. No `!important`.

---

Full article with all code examples and additional sections: [usertourkit.com/blog/z-index-product-tour-overlay](https://usertourkit.com/blog/z-index-product-tour-overlay)
