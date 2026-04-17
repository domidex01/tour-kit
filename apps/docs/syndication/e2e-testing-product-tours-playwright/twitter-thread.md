## Thread (6 tweets)

**1/** Product tours are the most fragile UI pattern in React apps — overlays, focus traps, z-index stacking, CSS animations — and almost nobody writes E2E tests for them.

I wrote the Playwright test suite that catches these bugs before production. 8 tests, 3.2 seconds. 🧵

**2/** The sneakiest bug: tooltip renders offscreen because a parent has `transform: translateZ(0)` for GPU acceleration.

This creates a new stacking context that breaks `position: fixed`.

Playwright's `boundingBox()` catches it. If the tooltip is outside 1280x720 viewport bounds, the test fails.

**3/** 90% of flaky tour tests come from animation timing.

Don't use `waitForTimeout(300)`.

Use the Web Animations API instead:
```
el.getAnimations().map(a => a.finished)
```

Standard browser API, works in all browsers since 2020.

**4/** The accessibility test most teams miss: focus restoration.

When a tour closes, focus should return to the trigger element. WCAG 2.4.3 requires it.

One Playwright test catches it:
```
await page.keyboard.press('Escape')
await expect(trigger).toBeFocused()
```

**5/** One config setting eliminates half the flakiness:

```
contextOptions: { reducedMotion: 'reduce' }
```

If your tour respects `prefers-reduced-motion` (it should), animations get disabled entirely in tests. No timing issues.

**6/** Full tutorial with all 8 TypeScript tests, a Playwright config, troubleshooting for the 3 most common failures, and an FAQ:

https://usertourkit.com/blog/e2e-testing-product-tours-playwright

The patterns work with any tour library — Joyride, Shepherd, Driver.js, or custom.
