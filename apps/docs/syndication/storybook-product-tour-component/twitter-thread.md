## Thread (6 tweets)

**1/** Storybook 7.1 shipped its own in-app guided tour to onboard new users.

Yet nobody has written about documenting YOUR tour components IN Storybook.

I wrote the guide that should exist. Here's what I found:

**2/** Play functions can test multi-step tour flows (step 1 -> 2 -> 3) with assertions at each transition.

Nobody does this. Every example online covers forms and buttons. But tours need verification that the tooltip repositioned, spotlight moved, and focus shifted at each step.

**3/** The a11y addon catches tour-specific WCAG issues instantly:

- Missing role="dialog" on tooltip containers
- No aria-label on spotlight overlays
- Focus not returning after tour completion

axe-core catches up to 57% of WCAG issues on every render. No Lighthouse audit needed.

**4/** Autodocs + headless architecture = auto-generated prop tables for TourStep[] arrays, callbacks, and config objects.

Tour Kit separates logic (<8KB) from rendering (<12KB). Storybook's MDX pages document both layers side by side.

**5/** Three numbers that matter:

- Storybook 8: 50% faster React startup than v7
- Storybook 10: 29% smaller install (ESM-only)
- axe-core: 57% of WCAG issues caught automatically

The tooling overhead for isolated tour component dev keeps shrinking.

**6/** Full guide with working TypeScript examples, play function scripts, and a comparison table:

https://usertourkit.com/blog/storybook-product-tour-component
