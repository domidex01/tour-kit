## Thread (6 tweets)

**1/** Product tours break in ways unit tests can't catch. Tooltip drifts 12px after a CSS refactor. Overlay bleeds on tablet. Highlight ring disappears behind a sticky header. All tests pass. Here's how we fixed it with Storybook + Chromatic:

**2/** The trick: each tour step becomes a Storybook story, captured at 3 viewports (mobile, tablet, desktop). Chromatic diffs every screenshot on every PR. 9 visual snapshots per component, per PR.

**3/** Play functions are the key piece. They simulate clicking "Next" twice, then Chromatic screenshots the result. You get visual proof that step 3's tooltip points at the right button after two clicks. Unit tests can't do that.

**4/** The math works: 3 stories x 3 viewports x 2 themes = 18 snapshots/PR. On the free tier (5,000/month) that's 3.6% of the budget. Chromatic processes 2,000 tests in under 2 minutes.

**5/** Biggest gotcha: animations cause flaky diffs. Fix: detect Chromatic's UA and set --transition-duration: 0ms. Also don't use layout: "centered" for tour components — it wraps in flex and breaks tooltip positioning.

**6/** Full tutorial with all code, GitHub Actions config, dark mode testing, accessibility audits, and troubleshooting: https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic
