## Title: Floating UI vs Popper.js for Tooltip Positioning: 2026 Comparison

## URL: https://usertourkit.com/blog/floating-ui-vs-popper-js-tour-positioning

## Comment to post immediately after:

I've been building a product tour library and spent time with both Floating UI and Popper.js. Wrote up the differences since there's a lot of confusion about which package to use now.

Key findings: Popper.js (@popperjs/core) hasn't had a meaningful release since late 2022. Floating UI (@floating-ui/dom) replaced it with a tree-shakeable middleware architecture that cuts the bundle from ~7kB to ~3kB gzipped. The API concepts map 1:1 (createPopper -> computePosition, modifiers -> middleware) so migration is straightforward.

The interesting bit: CSS Anchor Positioning (shipping in Chrome 125+ and Edge) could eventually replace both libraries for simple tooltip positioning, but it lacks Safari support and programmatic control for dynamic repositioning. Not viable for product tours yet, but worth watching.

I also mapped which React tour libraries use which engine — React Joyride v3 migrated to Floating UI, Shepherd.js bundles it, Reactour still uses Popper.js (which creates some React 19 concurrent rendering edge cases).
