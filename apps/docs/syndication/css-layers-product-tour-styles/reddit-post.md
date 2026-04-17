## Subreddit: r/css (primary), r/reactjs (secondary)

**Title:** CSS @layer is 4 years old and only 2.71% of sites use it — here's how it fixes the specificity mess when integrating third-party UI components

**Body:**

I wrote up a guide on using CSS cascade layers to solve a specific problem: specificity conflicts between product tour/onboarding libraries and host app styles.

The short version: when you portal a tooltip or overlay into an app that uses Bootstrap, MUI, or Tailwind, you get z-index stacking context traps, specificity arms races, and non-deterministic source order from code-splitting. Most teams end up plastering `!important` everywhere.

`@layer` fixes this by making layer position the controlling factor instead of selector specificity. You declare your layer order once (`@layer reset, third-party, host-app, tour-kit, utilities;`) and every selector respects that ordering regardless of specificity. A single class in a higher layer beats `#app .card .tooltip.active` in a lower layer.

The most useful part (for me at least) was the unlayered escape hatch — CSS outside any `@layer` block automatically wins over all layered styles. That's how you guarantee overlay lockout styles always render on top without `!important`.

Also compared `@layer` vs Shadow DOM for this use case. Shadow DOM breaks focus management, event bubbling, and `aria-describedby` references across boundaries — which is exactly what product tour UI needs to work correctly.

96% browser support since March 2022, but only ~2.71% adoption in production (Project Wallace 2026). The gap is education, not compatibility.

Full article with Tailwind integration patterns and code examples: https://usertourkit.com/blog/css-layers-product-tour-styles
