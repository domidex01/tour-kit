## Title: CSS @layer has 96% browser support but only 2.71% adoption — a practical guide to fixing specificity conflicts

## URL: https://usertourkit.com/blog/css-layers-product-tour-styles

## Comment to post immediately after:

I wrote this after spending too long debugging why a product tour overlay kept rendering behind a Bootstrap modal despite having z-index: 9999. The problem was a stacking context created by a parent's `transform` property — a trap that z-index alone can't solve.

CSS cascade layers (@layer) fix the specificity side of this problem by making layer position the controlling factor instead of selector weight. You declare `@layer reset, third-party, components, utilities;` once, and a single class in a higher layer beats `#app .card .btn.active` in a lower one. The `!important` reversal behavior is the most surprising part — `!important` in a lower-priority layer actually beats `!important` in a higher one, mirroring user-agent cascade behavior.

The article covers three specific failure modes (z-index stacking context traps, specificity arms races from Bootstrap/MUI selectors, and non-deterministic source order from code-splitting), the unlayered escape hatch for overlay lockout styles, and a comparison between @layer and Shadow DOM for UI component isolation. Short version: Shadow DOM breaks focus management and event bubbling across boundaries, which is a non-starter for tour/tooltip UI.

The adoption gap stat (2.71% of production sites per Project Wallace 2026, despite 4 years of universal support) suggests this is an education problem. Most @layer usage today is Tailwind's internal layer architecture, not developers using it directly.
