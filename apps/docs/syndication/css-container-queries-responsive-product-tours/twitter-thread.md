## Thread (6 tweets)

**1/** CSS container queries have 96% browser support. But most product tour libraries still use ResizeObserver for responsive tooltips.

I replaced JS resize logic with pure CSS @container queries. Here's what happened. 🧵

**2/** The problem: a tooltip in a 300px sidebar on a 1440px screen gets the "desktop" layout.

@media queries check viewport width. The viewport is wide. The container isn't.

Container queries check the parent element's width instead. That's what we actually need.

**3/** Performance difference was real:

- 35% faster rendering (Chrome DevTools, 2025)
- Zero layout thrashing vs 3-4 forced reflows with ResizeObserver
- 25% smaller bundle — no JS resize library needed

**4/** The gotcha that cost me an hour:

`container-type: size` → element collapses to zero height
`container-type: inline-size` → works perfectly

The browser needs explicit height for both-dimension containment. Tooltips only need width.

**5/** Tailwind v4 makes this even cleaner:

`@container` class on the wrapper
`@sm:flex-row` for medium containers
`@lg:p-5` for wide containers

Same responsive behavior, zero custom CSS files.

**6/** Full tutorial with plain CSS + Tailwind v4 code, comparison table, and portal troubleshooting:

https://usertourkit.com/blog/css-container-queries-responsive-product-tours
