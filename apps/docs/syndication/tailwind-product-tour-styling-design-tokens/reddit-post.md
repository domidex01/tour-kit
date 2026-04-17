## Subreddit: r/reactjs

**Title:** I wrote a guide on using Tailwind v4 design tokens to style product tours consistently

**Body:**

I've been working on a headless product tour library for React, and one thing that kept bugging me was how most tour libraries ship their own CSS that clashes with whatever design system you're already using. Tailwind v4's `@theme` directive opened up a clean approach.

The idea: define tour-specific tokens (overlay color, tooltip radius, beacon size, motion timing) as `@theme` values. Every token generates both a CSS variable and a Tailwind utility class. Your tour components consume these tokens the same way they'd consume any other part of your design system.

A few things I found interesting while writing this up:

- **Motion tokens are underserved.** Most design token articles cover color and spacing. Defining a duration scale (`--duration-fast: 100ms`, `--duration-slow: 300ms`) and wiring `prefers-reduced-motion` through token overrides is way cleaner than sprinkling `motion-safe:` on individual elements. One media query collapses everything.

- **ARIA-tied visibility works well for tour beacons.** Using Tailwind's `aria-expanded:` variant to control beacon visibility forces accessibility correctness — if the ARIA attribute is missing, the component looks broken. The visual bug catches the a11y gap.

- **Multi-brand theming is trivial with CSS cascade.** `[data-brand="acme"]` scoped token overrides re-theme the entire tour without JavaScript or context providers.

Tailwind v4 builds are also 5x faster (full) and 100x+ faster (incremental) than v3, which is a nice bonus when you're iterating on token values.

Full article with all the code (tooltip component, beacon, tour wiring, reduced-motion handling, troubleshooting): https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens

Would love to hear how others are handling tour/onboarding styling in Tailwind projects.
