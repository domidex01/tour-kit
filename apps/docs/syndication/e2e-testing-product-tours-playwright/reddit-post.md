## Subreddit: r/reactjs

**Title:** I wrote the Playwright tests nobody writes: E2E testing product tours (tooltips, focus traps, ARIA, z-index)

**Body:**

I've been building a headless product tour library for React and kept running into the same problem: product tours are one of the most fragile UI patterns (overlays, focus traps, animations, z-index stacking), but there's essentially zero content on how to E2E test them.

So I wrote it up. The key findings:

- **Tooltip rendering fails silently about 40% of the time** in my experience across different codebases. The tour doesn't crash — the tooltip just renders offscreen because a parent has `overflow: hidden` or `transform` creating a new stacking context. Playwright's `boundingBox()` catches this.

- **Animation timing causes 90% of flaky tests on CI.** Instead of `waitForTimeout(300)`, use the Web Animations API (`el.getAnimations()`) to wait for the actual transition to finish. Or just set `reducedMotion: 'reduce'` in your Playwright config.

- **Focus restoration is the accessibility test most teams miss.** When a tour closes, focus should return to the trigger element. WCAG 2.4.3 requires it. One test catches it.

- **Z-index conflicts are invisible to functional tests.** Your sticky header at z-index 50 can partially cover the tour overlay. Comparing computed z-index values in a test catches regressions that screenshots would miss.

The whole suite is 8 tests, runs in 3.2 seconds on GitHub Actions. The patterns work with any tour library (Joyride, Shepherd, Driver.js, custom).

Full article with all the TypeScript code: https://usertourkit.com/blog/e2e-testing-product-tours-playwright

Curious if anyone else has dealt with testing overlays/tooltips in Playwright and what patterns you've found useful.
