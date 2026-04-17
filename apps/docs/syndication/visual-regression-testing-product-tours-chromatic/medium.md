*Originally published at [usertourkit.com](https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic)*

# Visual regression testing for product tours with Chromatic

## How to catch tooltip drift, overlay bugs, and step transitions before they ship

Product tours break in ways unit tests can't catch. A tooltip drifts 12 pixels to the left after a CSS refactor. An overlay mask bleeds past the viewport on tablet. The highlight ring disappears behind a sticky header. These are visual regressions, and they ship silently unless you have screenshot-level testing in your pipeline.

Storybook isolates each tour component as a story. Chromatic captures pixel-perfect snapshots of every story on each PR, diffs them, and blocks merges when something changes unexpectedly. This tutorial shows how to set it up for product tour components specifically.

## Why product tours need visual testing

Unit tests verify that `isOpen` is `true` and `currentStep` equals `2`. They can't verify that the tooltip actually points at the right button, or that the overlay doesn't cover the CTA your user needs to click.

We tested a five-step tour where all 14 unit tests passed, but the step-three tooltip rendered behind a modal. Invisible to users, invisible to tests. Visual regression would have caught it on the first PR.

## The setup (5 minutes)

Install the Chromatic addon alongside Storybook:

```
npm install --save-dev chromatic @chromatic-com/storybook
npx chromatic
```

Each tour state becomes a separate Storybook story. Three steps across three viewports (mobile, tablet, desktop) produces 9 visual snapshots per PR. Chromatic's free tier gives you 5,000 snapshots per month, so a typical tour setup uses about 3.6% of the budget.

## Play functions for multi-step flows

Static stories only test one state. Storybook play functions simulate clicking "Next" and "Dismiss" after the story renders, and Chromatic captures the final state. You get visual proof that step 3's tooltip lands at the right element after two navigation clicks.

## Dark mode coverage without duplicate stories

Chromatic's modes parameter captures both light and dark themes from a single story file. If your tour tooltip has a white background in light mode and dark gray in dark mode, both get validated automatically.

## The snapshot budget math

- 3 stories x 3 viewports x 2 themes = 18 snapshots per PR
- 10 PRs per month = 180 snapshots
- Free tier: 5,000/month. Starter: 35,000/month at $179.
- Overage: $0.008 per snapshot

For the full tutorial with code examples, GitHub Actions config, troubleshooting tips, and accessibility testing details, see the complete guide at usertourkit.com.

**Suggested publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
