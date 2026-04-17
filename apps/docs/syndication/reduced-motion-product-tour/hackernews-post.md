## Title: Reduced motion support in product tour animations – WCAG 2.3.3 patterns for React

## URL: https://usertourkit.com/blog/reduced-motion-product-tour

## Comment to post immediately after:

I checked every major product tour/onboarding guide published in 2026 (Walnut, ProductFruits, Intercom) and none of them mention `prefers-reduced-motion`. This is surprising given that 35% of US adults over 40 have experienced vestibular dysfunction (NIH data).

Product tours are worse than single-element animations because they stack: tooltip enter + spotlight pulse + progress bar + tooltip exit, repeated per step. A 7-step tour produces 14+ motion events minimum.

The article covers the practical React implementation: a `usePrefersReducedMotion` hook with SSR safety (defaults to false, corrects in useEffect), CSS media queries for first-paint coverage, an in-tour toggle with `role="switch"` for users who haven't found their OS settings, and Playwright tests to prevent regressions.

One interesting design decision: reduced motion doesn't mean no motion. WCAG 2.3.3 uses the word "reduce" deliberately. The right approach is replacing spatial transforms (slides, scales) with opacity fades, not removing all visual feedback.
