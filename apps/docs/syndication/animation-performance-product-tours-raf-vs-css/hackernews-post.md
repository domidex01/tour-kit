## Title: Animation Performance in Product Tours: requestAnimationFrame vs CSS

## URL: https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css

## Comment to post immediately after:

Product tours (step-by-step tooltip walkthroughs) face a unique animation challenge: they run inside someone else's application and compete for the same rendering budget. I spent time profiling how different animation approaches perform in this context and found some things that surprised me.

The main finding: rAF and CSS aren't competing strategies for tour animations. They work as a two-layer system. CSS handles visual transitions (fade, scale, slide) on the compositor thread at zero main-thread cost. rAF handles scroll-synced position tracking where CSS has no equivalent. In production, you need both.

The most interesting discovery was implicit compositing. A tour tooltip animated at z-index 9999 silently forces every higher-stacked element in the host app onto its own GPU compositing layer. I measured 3 layers in a demo vs 14 in a production dashboard. Each layer costs ~307KB of GPU memory (width x height x 4 bytes), multiplied by 9 on high-DPI mobile screens.

Also documented a common antipattern where tour libraries update CSS custom properties per frame for spotlight positioning, which can force style recalculation across 1,300+ DOM elements at 8ms/frame.

The article includes a decision tree, WAAPI examples for controllable transitions, and a prefers-reduced-motion reference table specific to tour UI patterns.
