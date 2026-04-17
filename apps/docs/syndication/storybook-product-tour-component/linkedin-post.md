Product tour components are notoriously hard to test in a running application. You need the right page, the right user state, and the right sequence just to see the tooltip render.

I moved all Tour Kit component development into Storybook 8, and three things surprised me:

1. Play functions can script multi-step tour flows with assertions at each transition. Nobody covers this specific pattern online.

2. The a11y addon (axe-core) catches tour-specific WCAG issues immediately: missing dialog roles, broken focus return, and missing ARIA labels on spotlight overlays. It catches up to 57% of WCAG issues on every render.

3. Storybook's Autodocs auto-generate prop tables from TypeScript types, including complex TourStep[] arrays and callback signatures. Zero manual documentation.

An ironic detail: Storybook 7.1 shipped its own in-app guided tour to onboard new users, but nobody had written about documenting tour components inside Storybook.

Full guide with TypeScript examples: https://usertourkit.com/blog/storybook-product-tour-component

#react #storybook #webdevelopment #accessibility #typescript #opensource
