---
title: "E2E testing product tours with Playwright"
slug: "e2e-testing-product-tours-playwright"
canonical: https://usertourkit.com/blog/e2e-testing-product-tours-playwright
tags: react, javascript, testing, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/e2e-testing-product-tours-playwright)*

# E2E testing product tours with Playwright

Product tours are interactive overlays that create and destroy DOM elements, trap keyboard focus, reposition tooltips on scroll, and modify ARIA attributes on the fly. They touch almost every category of UI behavior that breaks in production: z-index stacking, animation timing, focus management, viewport-dependent positioning. And yet almost nobody writes E2E tests for them.

This tutorial walks through writing 8 Playwright tests covering tooltip rendering, step navigation, keyboard interaction, accessibility attributes, and the two flakiest edge cases: animation timing and overlay stacking. All tests run in 3.2 seconds on GitHub Actions.

We used [Tour Kit](https://usertourkit.com) (headless React tour library, core under 8KB gzipped), but the Playwright patterns work with any tour library — React Joyride, Shepherd.js, Driver.js, or a custom implementation.

Full article with code examples, troubleshooting section, and FAQ: [usertourkit.com/blog/e2e-testing-product-tours-playwright](https://usertourkit.com/blog/e2e-testing-product-tours-playwright)

> Note: The full article is 3,700 words with 6 complete TypeScript code examples. Read the full version for the complete implementation.

## Key takeaways

1. **Use a shared fixture** to start the tour before each test — avoids repeating setup across spec files
2. **Test viewport bounds** with `boundingBox()` — catches tooltips hidden by `overflow: hidden` or broken `position: fixed`
3. **Test keyboard navigation** (Escape, Tab, Arrow keys) — 96.3% of homepages fail WCAG, overlays are a top violation category
4. **Use `getAnimations()` API** instead of `waitForTimeout()` for animation timing — it's a standard Web Animations API, not a hack
5. **Set `reducedMotion: 'reduce'`** in Playwright config to eliminate animation-related flakiness on CI
6. **Test focus restoration** — when a tour closes, focus must return to the trigger element (WCAG 2.4.3)
7. **Test z-index stacking** — compare overlay z-index against known fixed elements like sticky headers
8. **Use `trace: 'on-first-retry'`** for debugging failures — Playwright 1.58's Timeline tab shows exactly where timing issues occur
