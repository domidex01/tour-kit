## Title: CSS Container Queries for Responsive Product Tour Tooltips

## URL: https://usertourkit.com/blog/css-container-queries-responsive-product-tours

## Comment to post immediately after:

I built Tour Kit (headless product tour library for React) and kept running into a responsive design problem: tooltips that look great in the main content area break when rendered inside a narrow sidebar. The viewport hasn't changed, but the available space has.

Switched from ResizeObserver to CSS container queries. The performance difference surprised me — 35% faster rendering on variable layouts according to Chrome DevTools benchmarks, and zero layout thrashing events versus 3-4 forced reflows per resize with the JS approach.

The main gotcha: `container-type: size` collapses elements to zero height. You want `inline-size` for width-only containment. Also, React portals break container queries because `document.body` is always full-width — you need to wrap portal content in a div sized to the target element.

96% browser support as of April 2026, works with Tailwind v4's native @container variants. The article has the full CSS, a Tailwind version, and three troubleshooting scenarios.
