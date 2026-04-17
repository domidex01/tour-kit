# E2E Testing Product Tours with Playwright

## Why nobody tests the most fragile UI component in their app

*Originally published at [usertourkit.com](https://usertourkit.com/blog/e2e-testing-product-tours-playwright)*

Product tours are interactive overlays that create DOM elements, trap keyboard focus, reposition tooltips on scroll, and modify ARIA attributes — all at once. They touch z-index stacking, animation timing, focus management, and viewport-dependent positioning. Every category of UI behavior that breaks in production.

And yet almost nobody writes E2E tests for them.

Search for "playwright test product tour" on Google and you get zero dedicated tutorials. The Playwright docs cover forms, navigation, and API mocking in depth. Overlays and guided flows? Nothing.

That gap is expensive. A broken onboarding tour fails silently — no error in your tracker, no crash report. The tour just doesn't appear, or it appears behind a modal, or it traps focus and the user can't escape. According to Pendo's 2025 report, apps with working onboarding tours see 2.5x higher 7-day retention.

## The 8-test suite

I wrote a Playwright test suite covering the critical paths for a product tour built with Tour Kit (a headless React tour library). The patterns work with any tour library.

The suite has 8 tests across 4 files:

- **Rendering** (2 tests): Is the tooltip visible? Is it within viewport bounds?
- **Navigation** (3 tests): Do Next/Back buttons work? Does the tour complete on the last step?
- **Keyboard + ARIA** (3 tests): Does Escape close the tour? Does focus return to the trigger? Are ARIA roles present?

All 8 tests run in 3.2 seconds on a GitHub Actions runner.

## The key insight: test the two flakiest patterns

90% of flaky tour tests come from two sources:

**Animation timing.** Tooltips fade in over 150–200ms. On a slow CI machine, that becomes 400ms. Instead of `waitForTimeout(300)`, use the Web Animations API:

```
await tooltip.evaluate((el) => {
  const animations = el.getAnimations()
  return Promise.all(animations.map(a => a.finished))
})
```

**Z-index conflicts.** If your sticky header is at `z-index: 50` and the overlay is at `z-index: 40`, the tour is broken but looks like it works. Write a test that compares the computed z-index values.

## Three config settings that matter

In `playwright.config.ts`:

1. `reducedMotion: 'reduce'` — disables CSS animations, eliminates timing flakiness
2. `trace: 'on-first-retry'` — captures a full trace on failure for debugging
3. `webServer` — auto-starts your dev server so tests are self-contained

The full article has all 8 tests with complete TypeScript code, a troubleshooting section for the 3 most common failures, and a comparison table of test categories.

**Read the full tutorial:** [usertourkit.com/blog/e2e-testing-product-tours-playwright](https://usertourkit.com/blog/e2e-testing-product-tours-playwright)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
