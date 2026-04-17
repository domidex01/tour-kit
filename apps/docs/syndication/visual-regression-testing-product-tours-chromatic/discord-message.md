## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how we use Storybook play functions + Chromatic to catch visual regressions in product tour components (tooltips, overlays, highlight masks). Turns out unit tests miss most of these bugs because they can't verify pixel-level positioning.

The play functions part is interesting — you simulate clicking "Next" through tour steps and Chromatic screenshots the final state. Catches tooltip drift, z-index issues, and overlay bleed at 3 viewport sizes.

https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic

Curious if anyone else is testing interactive UI flows this way, or if you've found a better approach for multi-state components?
