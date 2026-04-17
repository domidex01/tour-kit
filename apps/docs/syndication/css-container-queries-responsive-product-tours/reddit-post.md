## Subreddit: r/reactjs (primary), r/css (secondary)

### r/reactjs

**Title:** I replaced ResizeObserver with CSS container queries for product tour tooltips — 35% faster rendering, zero JS resize logic

**Body:**

I've been building product tour components and kept hitting the same problem: tooltips that look great in the main content area break completely when they render inside a narrow sidebar or collapsed panel. The viewport is still 1440px wide, so media queries and ResizeObserver both give you the "desktop" layout.

Switched to CSS container queries and the difference was immediate. You declare the tooltip wrapper as a containment context (`container: tour-step / inline-size`), then write `@container` rules instead of `@media`. The tooltip adapts to its parent element's width, not the viewport.

Three things I learned:

1. **Use `inline-size` not `size`** for container-type. `size` collapses elements to zero height because the browser needs explicit height for both-dimension containment. Spent an hour debugging that one.

2. **Portals break container queries.** If your tooltip renders in a portal attached to `document.body`, the container is always full-width. Fix: wrap portal content in a div with the target element's width.

3. **Performance is real.** Container queries render 35% faster than ResizeObserver on variable layouts (Chrome DevTools benchmarks). Zero layout thrashing versus 3-4 forced reflows per resize with JS.

96% browser support as of April 2026, no polyfill needed. Works with Tailwind v4's native `@container` variants too (`@sm:`, `@lg:` prefixes).

Full writeup with code examples and a Tailwind v4 version: https://usertourkit.com/blog/css-container-queries-responsive-product-tours

### r/css

**Title:** Using CSS container queries for tooltip components that adapt to their container, not the viewport

**Body:**

Wrote up a practical use case for container queries that I haven't seen covered anywhere: making product tour tooltips responsive to their parent container.

The problem: a tooltip rendered in a 300px sidebar on a 1440px screen gets the "desktop" layout because `@media` queries check viewport width. ResizeObserver works but causes layout thrashing and adds JS overhead.

With `@container` queries, you declare the wrapper as a containment context and write breakpoint rules against the container's inline size. Three tiers: compact (under 320px), medium (320-480px), expanded (480px+). The browser handles everything during layout calculation.

Key gotcha: `container-type: size` collapses elements to zero height. Use `inline-size` for width-only containment.

Full tutorial with CSS and a Tailwind v4 variant: https://usertourkit.com/blog/css-container-queries-responsive-product-tours
