There's no browser API that tells you "this element's position changed."

If you've built tooltips, popovers, or product tours, you've hit this problem. A sidebar collapses, content lazy-loads, an accordion opens — and your carefully positioned UI now floats in empty space.

I wrote a deep-dive mapping which of the three browser observer APIs (ResizeObserver, MutationObserver, IntersectionObserver) solves which specific positioning problem. The findings:

- 787 missing observer disconnects found across 500 repositories, each leaking ~8 KB per cycle
- ResizeObserver and IntersectionObserver require manual cleanup. MutationObserver doesn't — it's garbage collected automatically.
- Floating UI runs 4 observation strategies simultaneously for ~1ms position updates
- Sentry's product tour uses zero observer APIs — CSS-only positioning. A valid tradeoff for static UIs.

If your team builds any position-tracking UI, this maps the complete observer strategy you need:

https://usertourkit.com/blog/dom-observation-product-tour

#react #javascript #webdevelopment #frontend #browserapis
