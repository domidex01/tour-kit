## Title: Styling product tours with Tailwind CSS v4 design tokens

## URL: https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens

## Comment to post immediately after:

This walks through using Tailwind v4's @theme directive to build a three-layer token system (base, semantic, component) for product tour UI — overlays, tooltips, beacons, progress bars.

The interesting bits:

1. Motion tokens: defining a duration scale in @theme and collapsing all transitions to 0ms via one prefers-reduced-motion media query. Cleaner than per-element motion-safe: variants.

2. ARIA-tied visibility: using Tailwind's aria-expanded: variant to control beacon show/hide. If the ARIA attribute is missing, the component visually breaks — which surfaces the accessibility gap before shipping.

3. Multi-brand theming: [data-brand="acme"] scoped token overrides re-theme the entire tour through CSS cascade. No JavaScript, no React context.

The underlying library (Tour Kit) is headless — ships zero CSS — which is why the token approach works cleanly. Styled tour libraries (React Joyride, Shepherd.js) ship 15-25KB of their own CSS that you'd need to override.

Tailwind v4 performance numbers for context: full builds 5x faster than v3, incremental 100x+ faster.
