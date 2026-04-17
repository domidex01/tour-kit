# Why Your Product Tour Animations Break in Production

## The two-layer architecture that keeps tooltips at 60fps

*Originally published at [usertourkit.com](https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css)*

Your product tour works fine in isolation. Tooltips glide into view, spotlights pulse gently, step transitions feel crisp. Then you ship it into a real app with 300 components, three analytics scripts, and a WebSocket connection, and frames start dropping.

The reason isn't bad animation code. It's that you picked the wrong animation engine for the wrong job.

## Two engines, one budget

Browsers maintain two separate animation engines: a CPU-bound main thread (where your JavaScript, React renders, and layout calculations run) and a GPU compositor thread that handles `transform` and `opacity` changes independently. CSS animations using compositor-friendly properties run at consistent 60fps no matter how busy the main thread is. JavaScript animations via `requestAnimationFrame` compete for a 16.67ms budget with everything else.

For product tours, this distinction is critical. A landing page controls its own rendering load. A tour library is a guest inside someone else's application, where a heavy React reconciliation might fire at the exact moment the user clicks "Next step."

## When CSS wins (and when it can't)

CSS transitions handle 80% of tour animation needs at zero main-thread cost. Step transitions (fade in, scale up, slide to new position) should always use CSS on `transform` and `opacity`. These properties are guaranteed to run on the GPU compositor ([web.dev](https://web.dev/articles/css-vs-javascript)).

But CSS can't track scroll position. When a tooltip must follow an anchor element that moves as the user scrolls, you need JavaScript. This is where `requestAnimationFrame` earns its place.

## The insight most articles miss

rAF and CSS aren't competitors in a production tour. They work as a two-layer system. rAF handles position calculation (reading the anchor element's coordinates). CSS handles the visual transition (applying the new position smoothly). One reads, the other renders.

## The hidden trap: implicit compositing

A tour tooltip animated at z-index 9999 forces the browser to promote every higher-stacked element in the host app to its own GPU compositing layer. In testing, a tour overlay in isolation promoted 3 layers. The same overlay inside a production dashboard promoted 14. Each layer costs ~307KB of GPU memory. On a 3x mobile screen, multiply by 9.

This is the most common cause of "works in demo, jank in production."

## The CSS variable antipattern

Some tour libraries animate spotlight overlays by updating CSS custom properties every frame. This forces the browser to recalculate styles for every element that inherits from those variables. One documented case showed 1,300+ element recalculations at 8ms per frame ([Motion Magazine](https://motion.dev/magazine/web-animation-performance-tier-list)). Use `transform` on a positioned element instead.

## A decision tree for tour developers

Start with CSS transitions for tooltips and overlays. Use rAF only for scroll-synced repositioning. Use the Web Animations API when you need scriptable control (pause on hover, reverse on back click) without dropping to the main thread. Never animate width, height, top, or left in tour overlays. Never update CSS variables per frame for spotlight positioning.

No library can make a layout-triggering animation fast. The only fix is choosing the right property.

---

*Full article with code examples, WAAPI patterns, and a prefers-reduced-motion reference table: [usertourkit.com/blog/animation-performance-product-tours-raf-vs-css](https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css)*

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
