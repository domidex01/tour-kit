## Subreddit: r/reactjs

**Title:** How we use Storybook play functions + Chromatic to catch visual regressions in product tour components

**Body:**

We build a headless product tour library and kept running into a class of bugs that unit tests completely miss: tooltip drift after CSS refactors, overlay masks bleeding past viewport edges on tablet, highlight rings disappearing behind sticky headers.

The fix was Storybook + Chromatic. Each tour step becomes a story, each story gets captured at 3 viewports (375, 768, 1440px), and Chromatic diffs them on every PR. The interesting part is using play functions to simulate multi-step flows. A play function clicks "Next" twice, and Chromatic screenshots the result, so you get visual proof that step 3's tooltip actually points at the right element.

Some numbers: 3 stories x 3 viewports x 2 themes (light/dark) = 18 snapshots per PR. On the free tier (5,000/month), that's about 3.6% of the budget for 10 PRs. Chromatic processes 2,000 tests in under 2 minutes, so it doesn't slow down CI.

The biggest gotcha was animations causing flaky diffs. We fixed it by detecting Chromatic's user agent and setting `--transition-duration: 0ms`. Also learned to avoid `layout: "centered"` for tour components because it wraps in a flex container that changes tooltip positioning.

Full walkthrough with all the code, GitHub Actions config, and troubleshooting: https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic
