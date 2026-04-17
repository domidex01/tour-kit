---
title: "Why your product tour animations jank in production (and the two-layer fix)"
published: false
description: "Product tours run inside someone else's app, competing for the same 16.67ms frame budget. Here's when to use CSS vs requestAnimationFrame, and why most production tours need both."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css
cover_image: https://usertourkit.com/og-images/animation-performance-product-tours-raf-vs-css.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css)*

# Animation performance in product tours: requestAnimationFrame vs CSS

Your product tour works fine in isolation. Tooltips glide into view, spotlights pulse gently, and step transitions feel crisp. Then you ship it into a real app with 300 components, three analytics scripts, and a WebSocket connection, and frames start dropping on every step change.

The reason isn't that your animation code is "wrong." It's that you picked the wrong animation engine for the wrong job. Product tours sit in a unique position: they animate on top of someone else's app, compete for the same rendering budget, and must handle scroll-synced positioning that pure CSS can't touch.

## What determines animation performance in a product tour?

Product tour animation performance depends on which browser thread handles the animation work. Browsers run two separate animation engines: a CPU-bound main thread responsible for JavaScript, React renders, and layout calculations, and a GPU compositor thread that can apply `transform` and `opacity` changes without touching the main thread at all. CSS animations using compositor-friendly properties run at consistent 60fps regardless of main-thread load, while `requestAnimationFrame` callbacks compete with every other piece of JavaScript for that same 16.67ms frame budget ([web.dev](https://web.dev/articles/css-vs-javascript)).

That two-engine split matters more for product tours than for typical web animations. A marketing landing page controls its own rendering load. A tour library runs inside someone else's application, which might trigger a heavy React reconciliation at the exact moment the user clicks "Next step."

## Why animation performance matters for product tours

Dropped frames during a product tour don't just look bad. They actively undermine onboarding. Users who complete an onboarding tour are 2.5x more likely to convert to paid (Appcues 2024 Benchmark Report), but janky animations signal "unpolished product" and increase early abandonment.

Product tours also face a unique constraint: they're a guest in someone else's DOM. Your animation budget isn't 16.67ms per frame. It's whatever the host app leaves you.

## CSS animations: what they're good at in tours

CSS transitions and keyframes on `transform` and `opacity` run on the compositor thread with zero main-thread cost. Google's web.dev documentation puts it bluntly: "Use CSS when you have smaller, self-contained states for UI elements. CSS transitions and animations are ideal for bringing a navigation menu in from the side, or showing a tooltip" ([web.dev](https://web.dev/articles/css-vs-javascript)).

For step transitions (fading a tooltip in, scaling it up from 95% to 100%, sliding it from one position to another), CSS is the right default.

```tsx
// src/components/TourTooltip.tsx
import { useTour } from '@tourkit/react';

function TourTooltip({ children }: { children: React.ReactNode }) {
  const { isActive } = useTour();

  return (
    <div
      className={`
        transition-all duration-200 ease-out
        ${isActive
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }
      `}
    >
      {children}
    </div>
  );
}
```

Stick to `transform`, `opacity`, `filter`, and `clip-path`. These four properties can be completely offloaded to the GPU ([Smashing Magazine](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)). The moment you animate `width`, `height`, `top`, `left`, or `box-shadow`, you've dropped from S-tier to C or D-tier on the performance tier list ([Motion Magazine](https://motion.dev/magazine/web-animation-performance-tier-list)).

## requestAnimationFrame: when JavaScript animation is the right call

rAF synchronizes JavaScript calculations with the browser's paint cycle. For product tours, rAF earns its place in one specific scenario: repositioning a tooltip that must track a moving target during scroll, resize, or layout shifts.

The key insight most articles miss: **rAF and CSS aren't competitors in a production tour. They form a two-layer architecture.** rAF handles position *calculation* (reading the anchor element's current coordinates), and CSS handles the *visual transition* (applying the new position smoothly via `transform`).

```tsx
// src/hooks/useAnchorTracking.ts
import { useRef, useCallback, useEffect } from 'react';

function useAnchorTracking(anchorEl: HTMLElement | null) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  const updatePosition = useCallback(() => {
    if (!anchorEl || !tooltipRef.current) return;

    // READ phase: measure anchor position
    const rect = anchorEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.bottom + 8;

    // WRITE phase: apply via transform (compositor-friendly)
    tooltipRef.current.style.transform = `translate(${x}px, ${y}px)`;

    rafId.current = requestAnimationFrame(updatePosition);
  }, [anchorEl]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(rafId.current);
  }, [updatePosition]);

  return tooltipRef;
}
```

## The CSS variable spotlight antipattern

Some tour libraries animate spotlight overlays by updating CSS custom properties every frame:

```js
// Updating CSS variables in rAF: forces full style recalc
function animateSpotlight(x, y, radius) {
  requestAnimationFrame(() => {
    overlay.style.setProperty('--spotlight-x', `${x}px`);
    overlay.style.setProperty('--spotlight-y', `${y}px`);
    overlay.style.setProperty('--spotlight-radius', `${radius}px`);
  });
}
```

Every element that inherits from those variables recalculates styles on every single frame. Motion Magazine documented a case where this triggered recalculations on 1,300+ elements, consuming 8ms per frame ([Motion Magazine](https://motion.dev/magazine/web-animation-performance-tier-list)).

Use an SVG cutout or `clip-path` positioned with `transform` instead.

## Implicit compositing: the production-only jank

A tour tooltip animated at `z-index: 9999` forces the browser to promote every higher-stacked element to its own GPU layer. We measured this in Chrome DevTools: a tour overlay in isolation promoted 3 layers. The same overlay in a production dashboard promoted 14. Each 320x240 layer costs ~307KB of GPU memory. On a 3x mobile screen, multiply by 9.

**Mitigation:** Use the lowest possible z-index. Apply `will-change: transform` only during active animation. Check the Chrome Layers panel for unexpected promotions.

## The Web Animations API: an overlooked middle ground

WAAPI gives you scriptable control (pause, reverse, adjust playback rate) while still running on the compositor thread. It's the ideal API for tour step transitions that need programmatic control but shouldn't run on the main thread.

```tsx
function animateStepIn(element: HTMLElement) {
  return element.animate(
    [
      { opacity: 0, transform: 'translateY(8px) scale(0.96)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    {
      duration: 200,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    }
  );
}

// Pause, reverse, or cancel programmatically
const animation = animateStepIn(tooltipEl);
animation.pause();    // On hover
animation.reverse();  // On "Back" click
animation.cancel();   // On tour exit
```

## The decision tree for tour developers

1. **Start with CSS transitions** for tooltip appear/disappear, step transitions, and overlay fades. Use only `transform`, `opacity`, `filter`, or `clip-path`.
2. **Use rAF for scroll-synced repositioning** when the tooltip must track a moving anchor. Batch reads before writes.
3. **Use WAAPI for controllable transitions** where step animations need pause/resume/reverse.
4. **Avoid animating layout properties** (`width`, `height`, `top`, `left`). Refactor to `transform: scale()` and `translate()`.
5. **Never update CSS variables per frame** for spotlight positioning.

No library can make a layout-triggering animation fast; the only fix is choosing the right property.

---

Full article with comparison tables and prefers-reduced-motion guidance: [usertourkit.com/blog/animation-performance-product-tours-raf-vs-css](https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css)
