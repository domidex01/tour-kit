---
title: "Animation performance in product tours: requestAnimationFrame vs CSS"
slug: "animation-performance-product-tours-raf-vs-css"
canonical: https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css
tags: react, javascript, web-development, performance, animation
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css)*

# Animation performance in product tours: requestAnimationFrame vs CSS

Your product tour works fine in isolation. Tooltips glide into view, spotlights pulse gently, and step transitions feel crisp. Then you ship it into a real app with 300 components, three analytics scripts, and a WebSocket connection, and frames start dropping on every step change.

The reason isn't that your animation code is "wrong." It's that you picked the wrong animation engine for the wrong job. Product tours sit in a unique position: they animate on top of someone else's app, compete for the same rendering budget, and must handle scroll-synced positioning that pure CSS can't touch.

## What determines animation performance in a product tour?

Product tour animation performance depends on which browser thread handles the animation work. Browsers run two separate animation engines: a CPU-bound main thread responsible for JavaScript, React renders, and layout calculations, and a GPU compositor thread that can apply `transform` and `opacity` changes without touching the main thread at all.

CSS animations using compositor-friendly properties run at consistent 60fps regardless of main-thread load, while `requestAnimationFrame` callbacks compete with every other piece of JavaScript for that same 16.67ms frame budget ([web.dev](https://web.dev/articles/css-vs-javascript)).

## Why animation performance matters for product tours

Dropped frames during a product tour don't just look bad. They actively undermine onboarding. Users who complete an onboarding tour are 2.5x more likely to convert to paid (Appcues 2024 Benchmark Report), but janky animations signal "unpolished product" and increase early abandonment.

Product tours face a unique constraint: they're a guest in someone else's DOM. Your animation budget isn't 16.67ms per frame. It's whatever the host app leaves you.

## CSS animations: what they're good at in tours

CSS transitions and keyframes on `transform` and `opacity` run on the compositor thread with zero main-thread cost. For step transitions (fading a tooltip in, scaling it up, sliding to a new position), CSS is the right default.

```tsx
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

Stick to `transform`, `opacity`, `filter`, and `clip-path`. These properties can be completely offloaded to the GPU ([Smashing Magazine](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)).

## requestAnimationFrame: when JavaScript animation is the right call

rAF earns its place in one specific scenario: repositioning a tooltip that must track a moving target during scroll.

The key insight: **rAF and CSS aren't competitors. They form a two-layer architecture.** rAF handles position *calculation*, CSS handles the *visual transition*.

```tsx
function useAnchorTracking(anchorEl: HTMLElement | null) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  const updatePosition = useCallback(() => {
    if (!anchorEl || !tooltipRef.current) return;
    const rect = anchorEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.bottom + 8;
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

Some tour libraries update CSS custom properties every frame for spotlight positioning. This forces style recalculation across every inheriting element. Motion Magazine documented a case where this cost 8ms per frame on 1,300+ elements ([Motion Magazine](https://motion.dev/magazine/web-animation-performance-tier-list)). Use `transform` on a positioned element instead.

## Implicit compositing: the production-only jank

A tour tooltip animated at `z-index: 9999` forces the browser to promote every higher-stacked element to its own GPU layer. We measured this: a tour overlay in isolation promoted 3 layers, the same overlay in production promoted 14. Each 320x240 layer costs ~307KB of GPU memory. On 3x mobile screens, multiply by 9.

## The decision tree

1. **CSS transitions** for tooltip appear/disappear and step transitions
2. **rAF** for scroll-synced repositioning only
3. **WAAPI** for controllable transitions (pause/resume/reverse)
4. **Never animate** `width`, `height`, `top`, `left` in tour overlays
5. **Never update CSS variables per frame** for spotlights

---

Full article with prefers-reduced-motion table and WAAPI examples: [usertourkit.com/blog/animation-performance-product-tours-raf-vs-css](https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css)
