Scroll is the hardest unsolved problem in product tour libraries.

React Joyride has 9+ open GitHub issues caused by scroll bugs. Sentry's engineering team built a tour in React and skipped scroll handling entirely. When we tested a 7-step tour, 38% of sessions ended at the first step requiring a scroll.

Two CSS properties with full browser support since 2020 fix the most common problem (tooltips landing behind sticky headers) — and zero product tour libraries use them. Every library calculates pixel offsets in JavaScript instead.

I wrote a complete technical guide covering scrollIntoView, scroll-margin, Floating UI autoUpdate, Intersection Observer, and the WCAG 2.2 focus rules that 5/5 popular libraries fail.

https://usertourkit.com/blog/scroll-handling-product-tour

#react #javascript #webdevelopment #accessibility #opensource
